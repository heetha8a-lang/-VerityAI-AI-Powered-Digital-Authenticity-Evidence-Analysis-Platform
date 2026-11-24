import { GoogleGenAI } from "@google/genai";

export const VERITY_MODEL = "gemini-4-hydrogen";
export const VERITY_FALLBACK_MODEL = "gemini-3.1-flash-lite";

export class GeminiRouteError extends Error {
  status: number;
  code: string;
  isQuotaOrAuth: boolean;

  constructor(message: string, status = 500, code = "INTERNAL_ERROR", isQuotaOrAuth = false) {
    super(message);
    this.name = "GeminiRouteError";
    this.status = status;
    this.code = code;
    this.isQuotaOrAuth = isQuotaOrAuth;
  }
}

export function hasGeminiKey(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(apiKey && apiKey.trim() !== "" && apiKey !== "MY_GEMINI_API_KEY");
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new GeminiRouteError(
      "GEMINI_API_KEY is not configured. Add your API key in Settings > Secrets to run live server-side analysis.",
      401,
      "MISSING_API_KEY",
      true
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

interface ParsedErrorDetails {
  status: number;
  code: string;
  userMessage: string;
  isQuotaOrAuth: boolean;
}

export function parseGeminiError(err: unknown): ParsedErrorDetails {
  const raw = err instanceof Error ? err.message : String(err ?? "Unknown error");

  let parsedCode = "";
  let parsedStatus = 500;
  let innerMessage = raw;

  try {
    const start = raw.indexOf("{");
    if (start !== -1) {
      const jsonPart = JSON.parse(raw.slice(start)) as {
        error?: { code?: number; message?: string; status?: string };
      };
      if (jsonPart.error) {
        parsedStatus = jsonPart.error.code || 500;
        parsedCode = jsonPart.error.status || "";
        innerMessage = jsonPart.error.message || raw;
      }
    }
  } catch {
    // Fallback to string matching below
  }

  const lower = `${parsedCode} ${innerMessage} ${raw}`.toLowerCase();

  if (parsedStatus === 429 || lower.includes("resource_exhausted") || lower.includes("quota")) {
    return {
      status: 429,
      code: "RESOURCE_EXHAUSTED",
      userMessage:
        "Gemini API quota exceeded (429 RESOURCE_EXHAUSTED). Your current API key has reached its rate or daily free-tier quota limit. You can add a billing-enabled API key in Settings > Secrets, wait and retry, or run the Mock Prototype Engine below.",
      isQuotaOrAuth: true,
    };
  }

  if (
    parsedStatus === 403 ||
    parsedStatus === 401 ||
    lower.includes("permission_denied") ||
    lower.includes("api_key_invalid")
  ) {
    return {
      status: 403,
      code: "API_KEY_INVALID",
      userMessage:
        "Gemini API authentication failed (403/401). Check or update your API key in Settings > Secrets.",
      isQuotaOrAuth: true,
    };
  }

  if (parsedStatus === 404 || lower.includes("not_found")) {
    return {
      status: 404,
      code: "MODEL_NOT_FOUND",
      userMessage:
        "The requested Gemini model endpoint returned 404 Not Found. Verify model availability or try the Mock Prototype Engine.",
      isQuotaOrAuth: false,
    };
  }

  if (parsedStatus === 400 || lower.includes("invalid_argument")) {
    return {
      status: 400,
      code: "INVALID_ARGUMENT",
      userMessage: `Invalid request sent to the verification model: ${innerMessage}`,
      isQuotaOrAuth: false,
    };
  }

  return {
    status: parsedStatus >= 400 && parsedStatus < 600 ? parsedStatus : 500,
    code: parsedCode || "UPSTREAM_ERROR",
    userMessage: innerMessage.slice(0, 320),
    isQuotaOrAuth: false,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs a Gemini API call with short exponential backoff on transient rate limits
 * and automatic fallback to VERITY_FALLBACK_MODEL (optionally without search tools)
 * when the primary model or grounding tool hits 429.
 */
export async function executeWithModelFallback<T>(
  runFn: (model: string, allowTools: boolean) => Promise<T>
): Promise<{ result: T; modelUsed: string; usedTools: boolean }> {
  try {
    const result = await runFn(VERITY_MODEL, true);
    return { result, modelUsed: VERITY_MODEL, usedTools: true };
  } catch (primaryErr) {
    const details = parseGeminiError(primaryErr);

    if (details.status === 429 || details.status >= 500) {
      await sleep(700);
      try {
        const fallbackResult = await runFn(VERITY_FALLBACK_MODEL, false);
        return {
          result: fallbackResult,
          modelUsed: VERITY_FALLBACK_MODEL,
          usedTools: false,
        };
      } catch (fallbackErr) {
        const fbDetails = parseGeminiError(fallbackErr);
        throw new GeminiRouteError(
          fbDetails.userMessage,
          fbDetails.status,
          fbDetails.code,
          fbDetails.isQuotaOrAuth
        );
      }
    }

    throw new GeminiRouteError(
      details.userMessage,
      details.status,
      details.code,
      details.isQuotaOrAuth
    );
  }
}
