import { NextRequest, NextResponse } from "next/server";
import {
  executeWithModelFallback,
  GeminiRouteError,
  getGeminiClient,
  hasGeminiKey,
} from "@/lib/geminiServer";
import {
  extractGroundedSources,
  normalizeUrlInput,
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

interface NewsRequestBody {
  url?: string;
  claimText?: string;
  mode?: "live" | "mock";
}

interface RawNewsJson {
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
  sourcePublicationHints?: { url: string; publishedDate: string }[];
  confidenceLow?: number;
  confidenceHigh?: number;
  explanation?: string;
  limitations?: string[];
}

export async function POST(req: NextRequest) {
  let body: NewsRequestBody;
  try {
    body = (await req.json()) as NewsRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  try {
    const rawUrl = body.url?.trim() || "";
    const url = rawUrl ? normalizeUrlInput(rawUrl) : "";
    const claimText = body.claimText?.trim() || "";

    if (!url && !claimText) {
      return NextResponse.json(
        { error: "Provide a news article URL, a claim statement, or both." },
        { status: 400 }
      );
    }

    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: "The provided URL is not a valid web address." },
          { status: 400 }
        );
      }
    }

    if (body.mode === "mock" || !hasGeminiKey()) {
      const mockRecord = buildMockNewsInvestigation({
        url: url || undefined,
        claimText: claimText || undefined,
        type: "news",
      });
      saveServerInvestigation(mockRecord);
      return NextResponse.json(mockRecord);
    }

    const ai = getGeminiClient();

    const prompt = `Verify the following submission using real retrieved web evidence.
${url ? `Submitted Article URL: ${url}` : ""}
${claimText ? `Submitted Claim / Statement: ${claimText}` : ""}

Return ONLY a single raw JSON object (no markdown fences) with this exact shape:
{
  "title": "Short descriptive title for this verification (max 10 words)",
  "originalClaim": "Concise formulation of the primary claim being checked",
  "assessment": "Supported" | "Contradicted" | "Misleading" | "Unverified",
  "extractedClaims": [
    { "id": "CLM-1", "claim": "...", "assessment": "Supported" | "Contradicted" | "Misleading" | "Unverified", "rationale": "..." }
  ],
  "supportingEvidence": ["bullet of verified supporting fact from retrieved sources"],
  "contradictingEvidence": ["bullet of contradicting fact or missing context from retrieved sources"],
  "sourcePublicationHints": [{ "url": "exact URL if observed", "publishedDate": "YYYY-MM-DD or Unknown" }],
  "confidenceLow": 65,
  "confidenceHigh": 82,
  "explanation": "Clear explanation synthesizing what the retrieved sources establish and where gaps remain.",
  "limitations": ["Explicit limitations of current evidence retrieval"]
}

RULES:
- Never fabricate URLs, publication dates, or quotes. Only cite evidence actually observed in retrieved search/URL context.
- If retrieved sources are insufficient or ambiguous, classify as "Unverified" or "Misleading" accordingly.`;

    const runQuery = async (useUrlContext: boolean) => {
      return executeWithModelFallback((model, allowTools) => {
        const tools = !allowTools
          ? undefined
          : useUrlContext
          ? [{ googleSearch: {} }, { urlContext: {} }]
          : [{ googleSearch: {} }];

        return ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            ...(tools ? { tools } : {}),
            systemInstruction:
              "You are an objective fact-checking and evidence retrieval analyst for VerityAI. Never invent sources or citations. Use strictly one of: Supported, Contradicted, Misleading, Unverified.",
          },
        });
      });
    };

    let responseData;
    try {
      responseData = await runQuery(Boolean(url));
    } catch (err) {
      if (url && !(err instanceof GeminiRouteError && err.isQuotaOrAuth)) {
        responseData = await runQuery(false);
      } else {
        throw err;
      }
    }

    const { result: response, modelUsed, usedTools } = responseData;
    const parsed = tryExtractJsonObject<RawNewsJson>(response.text);

    const verdict: ClaimVerdict = parsed
      ? normalizeVerdict(parsed.assessment)
      : "Unverified";

    const dateHints: Record<string, string> = {};
    for (const h of parsed?.sourcePublicationHints ?? []) {
      if (h.url && h.publishedDate) {
        dateHints[h.url] = h.publishedDate;
      }
    }

    const sources = usedTools ? extractGroundedSources(response, dateHints) : [];

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
      "Evidence retrieval completed; review retrieved references below.";

    const baseLimitations =
      parsed?.limitations && parsed.limitations.length > 0
        ? parsed.limitations
        : [
            "Search grounding reflects publicly indexed web coverage at analysis time.",
            "Paywalled primary databases or offline records may not be indexed.",
          ];

    const limitations = usedTools
      ? baseLimitations
      : [
          "Live web search grounding hit API quota limits; response reflects model-only assessment without external web citations.",
          ...baseLimitations,
        ];

    const newsResult: NewsAnalysisResult = {
      originalClaim: parsed?.originalClaim || claimText || url,
      sourceUrl: url || undefined,
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
      type: "news",
      title: parsed?.title || (claimText ? claimText.slice(0, 64) : url),
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
          module: `Gemini Search-Grounded Fact Verification (${modelUsed})`,
          summary: newsResult.explanation,
          uncertainty: `Confidence band ${low}%–${high}%; ${sources.length} grounded web source(s) retrieved.`,
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
      err instanceof Error ? err.message : "Failed to verify news claim.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
