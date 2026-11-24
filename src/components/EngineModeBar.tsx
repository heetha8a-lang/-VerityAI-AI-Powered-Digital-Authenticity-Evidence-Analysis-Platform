"use client";

import { SegmentedTabs } from "@/components/ui/tabs";

export type AnalysisEngineMode = "live" | "mock";

export function EngineModeBar({
  mode,
  onChange,
}: {
  mode: AnalysisEngineMode;
  onChange: (mode: AnalysisEngineMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
          Verification Engine Mode
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {mode === "live"
            ? "Uses live server-side Gemini API (requires active GEMINI_API_KEY quota)."
            : "Uses clearly labelled Mock Prototype Layer (FastAPI placeholder — no API quota required)."}
        </p>
      </div>

      <SegmentedTabs
        value={mode}
        onChange={onChange}
        options={[
          { value: "live", label: "Live Gemini AI" },
          { value: "mock", label: "Mock Prototype" },
        ]}
      />
    </div>
  );
}
