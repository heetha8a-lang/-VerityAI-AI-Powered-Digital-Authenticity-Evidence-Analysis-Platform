"use client";

import { useCallback, useEffect, useState } from "react";
import { SAMPLE_ACTIVITY_DATA, SAMPLE_INVESTIGATIONS } from "@/lib/mockData";
import { ActivityPoint, InvestigationRecord } from "@/types/investigation";

const STORAGE_KEY = "verityai_investigations_v1";

function readFromStorage(): InvestigationRecord[] {
  if (typeof window === "undefined") return SAMPLE_INVESTIGATIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_INVESTIGATIONS));
      return SAMPLE_INVESTIGATIONS;
    }
    const parsed = JSON.parse(raw) as InvestigationRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return SAMPLE_INVESTIGATIONS;
    }
    return parsed;
  } catch {
    return SAMPLE_INVESTIGATIONS;
  }
}

function stripOversizedPreviews(records: InvestigationRecord[]): InvestigationRecord[] {
  return records.map((item, idx) => {
    // Only keep base64 data URLs under 180KB for the 3 newest items so localStorage never overflows
    if (
      item.previewImageUrl?.startsWith("data:") &&
      (idx > 2 || item.previewImageUrl.length > 180_000)
    ) {
      return { ...item, previewImageUrl: undefined };
    }
    return item;
  });
}

export function saveInvestigationToClientStore(record: InvestigationRecord): void {
  if (typeof window === "undefined") return;
  try {
    const current = readFromStorage();
    const filtered = current.filter((item) => item.id !== record.id);
    const next = stripOversizedPreviews([record, ...filtered]).slice(0, 40);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("verity-store-updated"));
  } catch {
    // If localStorage is still tight, drop all inline data URLs and retry once
    try {
      const current = readFromStorage();
      const slim = [record, ...current.filter((item) => item.id !== record.id)]
        .slice(0, 20)
        .map((item) =>
          item.previewImageUrl?.startsWith("data:")
            ? { ...item, previewImageUrl: undefined }
            : item
        );
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      window.dispatchEvent(new Event("verity-store-updated"));
    } catch {
      // Ignore unrecoverable storage restrictions
    }
  }
}

export function getInvestigationFromClientStore(id: string): InvestigationRecord | undefined {
  const list = readFromStorage();
  return list.find((item) => item.id === id);
}

export function useInvestigations() {
  const [investigations, setInvestigations] = useState<InvestigationRecord[]>(SAMPLE_INVESTIGATIONS);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setInvestigations(readFromStorage());
  }, []);

  useEffect(() => {
    setInvestigations(readFromStorage());
    setHydrated(true);

    const onUpdate = () => setInvestigations(readFromStorage());
    window.addEventListener("verity-store-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("verity-store-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const addInvestigation = useCallback((record: InvestigationRecord) => {
    saveInvestigationToClientStore(record);
    setInvestigations(readFromStorage());
  }, []);

  const resetToBaseline = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_INVESTIGATIONS));
      window.dispatchEvent(new Event("verity-store-updated"));
    }
    setInvestigations(SAMPLE_INVESTIGATIONS);
  }, []);

  const counts = {
    total: investigations.length,
    images: investigations.filter((i) => i.type === "image").length,
    news: investigations.filter((i) => i.type === "news" || i.type === "text").length,
    documents: investigations.filter((i) => i.type === "document").length,
  };

  const liveRecords = investigations.filter((i) => i.dataOrigin !== "Sample Baseline (Mock)");
  const activitySeries: ActivityPoint[] = SAMPLE_ACTIVITY_DATA.map((pt, idx) => {
    if (idx !== SAMPLE_ACTIVITY_DATA.length - 1 || liveRecords.length === 0) return pt;
    const addImg = liveRecords.filter((i) => i.type === "image").length;
    const addNews = liveRecords.filter((i) => i.type === "news").length;
    const addDoc = liveRecords.filter((i) => i.type === "document").length;
    const addText = liveRecords.filter((i) => i.type === "text").length;
    return {
      ...pt,
      images: pt.images + addImg,
      news: pt.news + addNews,
      documents: pt.documents + addDoc,
      text: pt.text + addText,
      total: pt.total + liveRecords.length,
    };
  });

  return {
    investigations,
    hydrated,
    counts,
    activitySeries,
    addInvestigation,
    resetToBaseline,
    refresh,
  };
}
