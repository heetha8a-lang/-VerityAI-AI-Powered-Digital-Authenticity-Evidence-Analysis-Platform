import { NextRequest, NextResponse } from "next/server";
import {
  executeWithModelFallback,
  GeminiRouteError,
  getGeminiClient,
  hasGeminiKey,
} from "@/lib/geminiServer";
import {
  extractGroundedSources,
  normalizeVerdict,
  tryExtractJsonObject,
} from "@/lib/groundingParser";
import { saveServerInvestigation } from "@/lib/investigationStoreServer";
import { buildMockDocumentInvestigation } from "@/lib/mockAnalyzer";
import { generateInvestigationId } from "@/lib/utils";
import {
  AssessmentCategory,
  DocumentAnalysisResult,
  InvestigationRecord,
} from "@/types/investigation";

interface DocumentRequestBody {
  fileName?: string;
  fileSize?: string;
  mimeType?: string;
  pdfBase64?: string;
  extractedTextFallback?: string;
  userContext?: string;
  mode?: "live" | "mock";
}

interface RawDocJson {
  title?: string;
  overallAssessment?: string;
  assessmentCategory?: "positive" | "caution" | "negative" | "neutral";
  pageCountEstimate?: number;
  extractedText?: string;
  documentMetadata?: {
    title?: string;
    authorOrOrg?: string;
    documentDate?: string;
    documentType?: string;
    wordCount?: number;
  };
  keyClaims?: {
    id?: string;
    claim: string;
    section: string;
    verificationNote: string;
    status: string;
  }[];
  comparisonFindings?: {
    topic: string;
    documentPosition: string;
    externalContext: string;
    alignment: "Aligned" | "Divergent" | "Requires Review";
  }[];
  confidenceLow?: number;
  confidenceHigh?: number;
  explanation?: string;
  limitations?: string[];
}

export async function POST(req: NextRequest) {
  let body: DocumentRequestBody;
  try {
    body = (await req.json()) as DocumentRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  try {
    if (!body.pdfBase64 && !body.extractedTextFallback?.trim()) {
      return NextResponse.json(
        { error: "Please upload a PDF file or provide document text to analyze." },
        { status: 400 }
      );
    }

    if (body.mode === "mock" || !hasGeminiKey()) {
      const mockRecord = buildMockDocumentInvestigation({
        fileName: body.fileName || "submitted-document.pdf",
        fileSize: body.fileSize || "Unknown",
        mimeType: body.mimeType || "application/pdf",
        extractedTextFallback: body.extractedTextFallback,
        userContext: body.userContext,
      });
      saveServerInvestigation(mockRecord);
      return NextResponse.json(mockRecord);
    }

    const ai = getGeminiClient();

    const parts: Array<
      { inlineData: { mimeType: string; data: string } } | { text: string }
    > = [];

    if (body.pdfBase64) {
      const cleanBase64 = body.pdfBase64.includes(",")
        ? body.pdfBase64.split(",")[1]
        : body.pdfBase64;
      parts.push({
        inlineData: {
          mimeType: body.mimeType || "application/pdf",
          data: cleanBase64,
        },
      });
    }

    parts.push({
      text: `Analyze this document (${body.fileName ?? "document.pdf"}, size ${
        body.fileSize ?? "Unknown"
      }) for key factual claims, internal consistency, metadata cues, and external corroboration using Google Search where helpful.
${
  body.extractedTextFallback
    ? `\nDocument Content:\n${body.extractedTextFallback.slice(0, 18000)}\n`
    : ""
}
${body.userContext ? `Focus instructions: ${body.userContext}` : ""}

Return ONLY a single raw JSON object (no markdown fences) with this exact structure:
{
  "title": "Concise document title",
  "overallAssessment": "Short summary label or verdict (max 14 words)",
  "assessmentCategory": "positive" | "caution" | "negative" | "neutral",
  "pageCountEstimate": 4,
  "extractedText": "Clean extracted text summary / key verbatim excerpts from the document (up to 1600 characters)",
  "documentMetadata": {
    "title": "...",
    "authorOrOrg": "...",
    "documentDate": "...",
    "documentType": "...",
    "wordCount": 1200
  },
  "keyClaims": [
    {
      "id": "DOC-1",
      "claim": "...",
      "section": "Page/Section",
      "verificationNote": "...",
      "status": "Supported" | "Contradicted" | "Misleading" | "Unverified"
    }
  ],
  "comparisonFindings": [
    {
      "topic": "...",
      "documentPosition": "...",
      "externalContext": "...",
      "alignment": "Aligned" | "Divergent" | "Requires Review"
    }
  ],
  "confidenceLow": 64,
  "confidenceHigh": 80,
  "explanation": "...",
  "limitations": ["..."]
}`,
    });

    const { result: response, modelUsed, usedTools } = await executeWithModelFallback(
      (model, allowTools) =>
        ai.models.generateContent({
          model,
          contents: { parts },
          config: {
            ...(allowTools ? { tools: [{ googleSearch: {} }] } : {}),
            systemInstruction:
              "You are a document intelligence and forensic verification analyst for VerityAI. Extract verifiable claims, compare against retrieved public evidence, and clearly note uncertainty or missing primary citations.",
          },
        })
    );

    const parsed = tryExtractJsonObject<RawDocJson>(response.text);
    const sources = usedTools ? extractGroundedSources(response) : [];

    const low = Math.max(25, Math.min(90, Math.round(parsed?.confidenceLow ?? 58)));
    const high = Math.max(low + 5, Math.min(95, Math.round(parsed?.confidenceHigh ?? 75)));

    const keyClaims = (parsed?.keyClaims ?? []).map((k, idx) => ({
      id: k.id || `DOC-${idx + 1}`,
      claim: k.claim,
      section: k.section || "Document Body",
      verificationNote: k.verificationNote,
      status: normalizeVerdict(k.status),
    }));

    const comparisonFindings = parsed?.comparisonFindings ?? [];
    const fallbackExplanation =
      (response.text ?? "").trim() ||
      "Document extraction and claim audit complete.";

    const baseLimitations =
      parsed?.limitations && parsed.limitations.length > 0
        ? parsed.limitations
        : [
            "Scanned image-only PDFs without embedded OCR layers may have reduced extraction accuracy.",
            "Internal financial or proprietary datasets cannot be independently audited from public web sources.",
          ];

    const limitations = usedTools
      ? baseLimitations
      : [
          "Live web search grounding hit API quota limits; document analysis reflects internal document inspection only.",
          ...baseLimitations,
        ];

    const docResult: DocumentAnalysisResult = {
      fileName: body.fileName || "submitted-document.pdf",
      fileSize: body.fileSize || "Unknown",
      pageCountEstimate: Math.max(1, Math.round(parsed?.pageCountEstimate ?? 1)),
      mimeType: body.mimeType || "application/pdf",
      extractedText:
        parsed?.extractedText ||
        body.extractedTextFallback?.slice(0, 1600) ||
        fallbackExplanation.slice(0, 1600),
      documentMetadata: {
        title: parsed?.documentMetadata?.title || body.fileName || "Submitted Document",
        authorOrOrg: parsed?.documentMetadata?.authorOrOrg || "Not specified in document",
        documentDate: parsed?.documentMetadata?.documentDate || "Not specified",
        documentType: parsed?.documentMetadata?.documentType || "Document / Report",
        wordCount: Math.max(0, Math.round(parsed?.documentMetadata?.wordCount ?? 0)),
      },
      keyClaims,
      comparisonFindings,
      overallAssessment:
        parsed?.overallAssessment || "Document review completed with calibrated caveats.",
      confidenceRange: {
        low,
        high,
        label: `${low}%–${high}% calibrated estimate`,
      },
      explanation: parsed?.explanation || fallbackExplanation,
      limitations,
    };

    const allowedCat: AssessmentCategory[] = ["positive", "caution", "negative", "neutral"];
    const cat: AssessmentCategory = allowedCat.includes(
      parsed?.assessmentCategory as AssessmentCategory
    )
      ? (parsed?.assessmentCategory as AssessmentCategory)
      : "neutral";

    const id = generateInvestigationId("VR");
    const record: InvestigationRecord = {
      id,
      type: "document",
      title: parsed?.title || docResult.documentMetadata.title,
      submittedSummary: `${docResult.fileName} (${docResult.fileSize}) — ${docResult.overallAssessment}`,
      createdAt: new Date().toISOString(),
      status: "completed",
      assessmentLabel: docResult.overallAssessment,
      assessmentCategory: cat,
      confidenceLabel: docResult.confidenceRange.label,
      dataOrigin: "Live Gemini Prototype",
      documentResult: docResult,
      evidenceTable: [
        ...keyClaims.map((k) => ({
          factor: `${k.id} (${k.section})`,
          observation: `${k.claim} — ${k.verificationNote}`,
          signal: k.status,
          weight: "Primary",
        })),
        ...comparisonFindings.map((cf) => ({
          factor: cf.topic,
          observation: `${cf.documentPosition} vs. ${cf.externalContext}`,
          signal: cf.alignment,
          weight: "Comparative",
        })),
      ],
      modelFindings: [
        {
          module: `Gemini PDF & Claim Extraction Pipeline (${modelUsed})`,
          summary: docResult.explanation,
          uncertainty: `Confidence band ${low}%–${high}%`,
        },
      ],
      sources,
      limitations: docResult.limitations,
    };

    saveServerInvestigation(record);
    return NextResponse.json(record);
  } catch (err) {
    if (err instanceof GeminiRouteError) {
      return NextResponse.json(
        { error: err.message, code: err.code, isQuotaOrAuth: err.isQuotaOrAuth },
        { status: err.status }
      );
    }
    const message =
      err instanceof Error ? err.message : "Failed to analyze document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
