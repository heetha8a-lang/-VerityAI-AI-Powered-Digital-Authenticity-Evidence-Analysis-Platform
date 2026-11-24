import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value = 0,
  className,
}: {
  value?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800",
        className
      )}
    >
      <div
        className="h-full bg-indigo-600 transition-transform duration-300 ease-out dark:bg-indigo-500"
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </div>
  );
}
