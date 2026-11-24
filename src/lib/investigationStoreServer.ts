import { SAMPLE_INVESTIGATIONS } from "@/lib/mockData";
import { InvestigationRecord, InvestigationType } from "@/types/investigation";

// Server-side in-memory store for prototype REST endpoints (GET /api/investigations, /api/reports/[id])
// Ready to be replaced by Python FastAPI + PostgreSQL/Redis persistence without UI changes.
const globalForStore = globalThis as unknown as {
  verityServerInvestigations?: InvestigationRecord[];
};

function getRegistry(): InvestigationRecord[] {
  if (!globalForStore.verityServerInvestigations) {
    globalForStore.verityServerInvestigations = [...SAMPLE_INVESTIGATIONS];
  }
  return globalForStore.verityServerInvestigations;
}

export function listServerInvestigations(filters?: {
  type?: InvestigationType | "all";
  q?: string;
}): InvestigationRecord[] {
  const items = getRegistry();
  return items.filter((item) => {
    if (filters?.type && filters.type !== "all" && item.type !== filters.type) {
      return false;
    }
    if (filters?.q) {
      const needle = filters.q.toLowerCase();
      const hay = `${item.id} ${item.title} ${item.submittedSummary} ${item.assessmentLabel}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

export function getServerInvestigationById(id: string): InvestigationRecord | undefined {
  return getRegistry().find((item) => item.id === id);
}

export function saveServerInvestigation(record: InvestigationRecord): void {
  const items = getRegistry();
  const existingIdx = items.findIndex((i) => i.id === record.id);
  if (existingIdx >= 0) {
    items[existingIdx] = record;
  } else {
    items.unshift(record);
  }
}
