import { GenerateContentResponse } from "@google/genai";
import {
  AssessmentCategory,
  ClaimVerdict,
  SourceReference,
} from "@/types/investigation";

export function extractJsonObject<T>(rawText: string | undefined): T {
  const trimmed = (rawText ?? "").trim();
  if (!trimmed) {
    throw new Error("Model returned an empty response.");
  }

  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Model response did not contain a valid JSON object.");
  }
  const candidate = withoutFences.slice(firstBrace, lastBrace + 1);
  return JSON.parse(candidate) as T;
}

export function tryExtractJsonObject<T>(rawText: string | undefined): T | null {
  try {
    return extractJsonObject<T>(rawText);
  } catch {
    return null;
  }
}

export function extractGroundedSources(
  response: GenerateContentResponse,
  publishedDatesMap?: Record<string, string>
): SourceReference[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();
  const sources: SourceReference[] = [];

  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    const title = chunk.web?.title;
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);

    let hostName = "Web Source";
    try {
      const parsed = new URL(uri);
      hostName = parsed.hostname.replace(/^www\./, "");
    } catch {
      hostName = title || "Web Source";
    }

    sources.push({
      name: hostName,
      title: title || hostName,
      url: uri,
      publishedDate: publishedDatesMap?.[uri] || "Verified Web Reference",
    });
  }

  return sources;
}

export function normalizeUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function verdictToCategory(verdict: ClaimVerdict): AssessmentCategory {
  switch (verdict) {
    case "Supported":
      return "positive";
    case "Contradicted":
      return "negative";
    case "Misleading":
      return "caution";
    case "Unverified":
    default:
      return "neutral";
  }
}

export function normalizeVerdict(val: string | undefined): ClaimVerdict {
  const lower = (val ?? "").toLowerCase();
  if (lower.includes("support")) return "Supported";
  if (lower.includes("contradict") || lower.includes("false") || lower.includes("refut")) {
    return "Contradicted";
  }
  if (lower.includes("mislead")) return "Misleading";
  return "Unverified";
}
