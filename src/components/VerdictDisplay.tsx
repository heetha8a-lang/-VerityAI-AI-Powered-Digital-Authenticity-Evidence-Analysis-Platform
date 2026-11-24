import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AssessmentCategory } from "@/types/investigation";

export function VerdictDisplay({
  label,
  category,
  className,
}: {
  label: string;
  category: AssessmentCategory;
  className?: string;
}) {
  const styles: Record<
    AssessmentCategory,
    { text: string; bg: string; Icon: typeof CheckCircle2 }
  > = {
    positive: {
      text: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50/80 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-900/60",
      Icon: CheckCircle2,
    },
    caution: {
      text: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-50/80 border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-900/60",
      Icon: AlertTriangle,
    },
    negative: {
      text: "text-rose-700 dark:text-rose-400",
      bg: "bg-rose-50/80 border-rose-200/80 dark:bg-rose-950/40 dark:border-rose-900/60",
      Icon: XCircle,
    },
    neutral: {
      text: "text-slate-700 dark:text-slate-300",
      bg: "bg-slate-100/80 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700",
      Icon: HelpCircle,
    },
  };

  const { text, bg, Icon } = styles[category] ?? styles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0",
        bg,
        text,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
