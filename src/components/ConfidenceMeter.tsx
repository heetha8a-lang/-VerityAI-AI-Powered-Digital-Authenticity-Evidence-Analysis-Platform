import { cn } from "@/lib/utils";
import { ConfidenceRange } from "@/types/investigation";

export function ConfidenceMeter({
  range,
  note,
  className,
}: {
  range: ConfidenceRange;
  note?: string;
  className?: string;
}) {
  const low = Math.max(0, Math.min(100, range.low));
  const high = Math.max(low, Math.min(100, range.high));
  const width = Math.max(4, high - low);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-4 text-xs">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Calibrated Confidence Band
        </span>
        <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
          {low}%–{high}%
        </span>
      </div>
      <div className="relative h-2.5 w-full rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="absolute top-0 bottom-0 rounded-sm bg-indigo-600/85 dark:bg-indigo-500/85"
          style={{
            left: `${low}%`,
            width: `${width}%`,
          }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
        <span>0% (Low certainty)</span>
        <span>50% (Uncertain)</span>
        <span>100%</span>
      </div>
      {note && (
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {note}
        </p>
      )}
    </div>
  );
}
