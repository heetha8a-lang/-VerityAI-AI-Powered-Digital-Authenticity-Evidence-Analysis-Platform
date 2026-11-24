import {
  InvestigationRecord,
  InvestigationType,
} from "@/types/investigation";

/**
 * Service layer designed for seamless swap between Next.js prototype API routes
 * and an external Python FastAPI ML backend (via NEXT_PUBLIC_FASTAPI_BASE_URL).
 */
const API_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_FASTAPI_BASE_URL
    ? process.env.NEXT_PUBLIC_FASTAPI_BASE_URL.replace(/\/$/, "")
    : "";

export class ApiClientError extends Error {
  status: number;
  code?: string;
  isQuotaOrAuth: boolean;

  constructor(
    message: string,
    status = 500,
    code?: string,
    isQuotaOrAuth = false
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.isQuotaOrAuth = isQuotaOrAuth;
  }
}

export interface ImageInvestigationPayload {
  imageBase64: string;
  mimeType: string;
  fileName: string;
  fileSize: string;
  dimensions: string;
  aspectRatio: string;
  exifStatus: string;
  lastModified?: string;
  userContext?: string;
  mode?: "live" | "mock";
}

export interface NewsInvestigationPayload {
  url?: string;
  claimText?: string;
  mode?: "live" | "mock";
}

export interface DocumentInvestigationPayload {
  fileName: string;
  fileSize: string;
  mimeType: string;
  pdfBase64?: string;
  extractedTextFallback?: string;
  userContext?: string;
  mode?: "live" | "mock";
}

export interface TextInvestigationPayload {
  claimText: string;
  context?: string;
  mode?: "live" | "mock";
}

async function handleApiResponse<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    isQuotaOrAuth?: boolean;
  };
  if (!res.ok) {
    const message =
      payload.error || `Request failed with status ${res.status}`;
    throw new ApiClientError(
      message,
      res.status,
      payload.code,
      Boolean(payload.isQuotaOrAuth || res.status === 429 || res.status === 401 || res.status === 403)
    );
  }
  return payload as T;
}

export const investigationService = {
  async analyzeImage(
    payload: ImageInvestigationPayload
  ): Promise<InvestigationRecord> {
    const res = await fetch(`${API_BASE}/api/investigations/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleApiResponse<InvestigationRecord>(res);
  },

  async analyzeNews(
    payload: NewsInvestigationPayload
  ): Promise<InvestigationRecord> {
    const res = await fetch(`${API_BASE}/api/investigations/news`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleApiResponse<InvestigationRecord>(res);
  },

  async analyzeDocument(
    payload: DocumentInvestigationPayload
  ): Promise<InvestigationRecord> {
    const res = await fetch(`${API_BASE}/api/investigations/document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleApiResponse<InvestigationRecord>(res);
  },

  async analyzeText(
    payload: TextInvestigationPayload
  ): Promise<InvestigationRecord> {
    const res = await fetch(`${API_BASE}/api/investigations/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleApiResponse<InvestigationRecord>(res);
  },

  async listInvestigations(params?: {
    type?: InvestigationType | "all";
    q?: string;
  }): Promise<InvestigationRecord[]> {
    const search = new URLSearchParams();
    if (params?.type && params.type !== "all") search.set("type", params.type);
    if (params?.q) search.set("q", params.q);
    const qs = search.toString();
    const res = await fetch(
      `${API_BASE}/api/investigations${qs ? `?${qs}` : ""}`
    );
    return handleApiResponse<InvestigationRecord[]>(res);
  },

  async getInvestigationById(id: string): Promise<InvestigationRecord> {
    const res = await fetch(`${API_BASE}/api/investigations/${encodeURIComponent(id)}`);
    return handleApiResponse<InvestigationRecord>(res);
  },

  async getReportById(id: string): Promise<InvestigationRecord> {
    const res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(id)}`);
    return handleApiResponse<InvestigationRecord>(res);
  },
};
