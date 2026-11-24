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
  verdictToCategory,
} from "@/lib/groundingParser";
import { saveServerInvestigation } from "@/lib/investigationStoreServer";
import { buildMockNewsInvestigation } from "@/lib/mockAnalyzer";
import { generateInvestigationId } from "@/lib/utils";
import {
  ClaimVerdict,
  InvestigationRecord,
  NewsAnalysisResult,
} from "@/types/investigation";

interface TextRequestBody {
  claimText?: string;
  context?: string;
  mode?: "live" | "mock";
}

interface RawTextJson {
  title?: string;
  originalClaim?: string;
  assessment?: string;
  extractedClaims?: {
    id?: string;
    claim: string;
    assessment: string;
    rationale: string;
  }[];
  supportingEvidence?: string[];
  contradictingEvidence?: string[];
  confidenceLow?: number;
  confidenceHigh?: number;
  explanation?: string;
  limitations?: string[];
}

export async function POST(req: NextRequest) {
  let body: TextRequestBody;
  try {
    body = (await req.json()) as TextRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  try {
    const claimText = body.claimText?.trim() || "";

    if (!claimText || claimText.length < 8) {
      return NextResponse.json(
        { error: "Please enter a statement of at least 8 characters to verify." },
        { status: 400 }
      );
    }

    if (body.mode === "mock" || !hasGeminiKey()) {
      const mockRecord = buildMockNewsInvestigation({
        claimText,
        type: "text",
      });
      saveServerInvestigation(mockRecord);
      return NextResponse.json(mockRecord);
    }

    const ai = getGeminiClient();

    const prompt = `Verify the following text claim using Google Search grounding:
Claim: "${claimText}"
${body.context ? `Context: ${body.context}` : ""}

Return ONLY a single raw JSON object (no markdown fences) matching:
{
  "title": "Short descriptive title (max 10 words)",
  "originalClaim": "Restatement of the submitted claim",
  "assessment": "Supported" | "Contradicted" | "Misleading" | "Unverified",
  "extractedClaims": [
    { "id": "CLM-1", "claim": "...", "assessment": "Supported" | "Contradicted" | "Misleading" | "Unverified", "rationale": "..." }
  ],
  "supportingEvidence": ["..."],
  "contradictingEvidence": ["..."],
  "confidenceLow": 65,
  "confidenceHigh": 82,
  "explanation": "...",
  "limitations": ["..."]
}`;

    const { result: response, modelUsed, usedTools } = await executeWithModelFallback(
      (model, allowTools) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            ...(allowTools ? { tools: [{ googleSearch: {} }] } : {}),
            systemInstruction:
              "You are a rigorous claim verification analyst for VerityAI. Never fabricate citations. Classify strictly as Supported, Contradicted, Misleading, or Unverified.",
          },
        })
    );

    const parsed = tryExtractJsonObject<RawTextJson>(response.text);
    const verdict: ClaimVerdict = parsed
      ? normalizeVerdict(parsed.assessment)
      : "Unverified";
    const sources = usedTools ? extractGroundedSources(response) : [];

    const low = Math.max(25, Math.min(90, Math.round(parsed?.confidenceLow ?? 55)));
    const high = Math.max(low + 5, Math.min(95, Math.round(parsed?.confidenceHigh ?? 72)));
    const nowIso = new Date().toISOString();

    const extractedClaims = (parsed?.extractedClaims ?? []).map((c, idx) => ({
      id: c.id || `CLM-${idx + 1}`,
      claim: c.claim,
      assessment: normalizeVerdict(c.assessment),
      rationale: c.rationale,
    }));

    const fallbackExplanation =
      (response.text ?? "").trim() ||
      "Verification completed; review retrieved web references below.";

    const baseLimitations =
      parsed?.limitations && parsed.limitations.length > 0
        ? parsed.limitations
        : ["Evidence scope depends on publicly indexed web documentation."];

    const limitations = usedTools
      ? baseLimitations
      : [
          "Live web search grounding hit API quota limits; response reflects model-only assessment without external web citations.",
          ...baseLimitations,
        ];

    const newsResult: NewsAnalysisResult = {
      originalClaim: parsed?.originalClaim || claimText,
      assessment: verdict,
      extractedClaims,
      supportingEvidence: parsed?.supportingEvidence ?? [],
      contradictingEvidence: parsed?.contradictingEvidence ?? [],
      sources,
      analysisTimestamp: nowIso,
      confidenceRange: {
        low,
        high,
        label: `${low}%–${high}% calibrated estimate`,
      },
      explanation: parsed?.explanation || fallbackExplanation,
      limitations,
    };

    const id = generateInvestigationId("VR");
    const record: InvestigationRecord = {
      id,
      type: "text",
      title: parsed?.title || claimText.slice(0, 64),
      submittedSummary: newsResult.originalClaim,
      createdAt: nowIso,
      status: "completed",
      assessmentLabel: verdict,
      assessmentCategory: verdictToCategory(verdict),
      confidenceLabel: newsResult.confidenceRange.label,
      dataOrigin: "Live Gemini Prototype",
      newsResult,
      evidenceTable: extractedClaims.map((c) => ({
        factor: c.id,
        observation: `${c.claim} — ${c.rationale}`,
        signal: c.assessment,
        weight: "Primary",
      })),
      modelFindings: [
        {
          module: `Gemini Text Claim Cross-Reference (${modelUsed})`,
          summary: newsResult.explanation,
          uncertainty: `Confidence band ${low}%–${high}%; ${sources.length} web reference(s) retrieved.`,
        },
      ],
      sources,
      limitations: newsResult.limitations,
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
      err instanceof Error ? err.message : "Failed to verify text claim.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
