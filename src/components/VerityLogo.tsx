import Link from "next/link";
import { cn } from "@/lib/utils";

export function VerityLogo({
  href = "/",
  light = false,
  className,
}: {
  href?: string;
  light?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md",
        className
      )}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
          stroke={light ? "#818CF8" : "#4F46E5"}
          strokeWidth="1.75"
        />
        <path
          d="M8.5 12.2L10.9 14.6L15.8 9.5"
          stroke={light ? "#F8FAFC" : "#0F172A"}
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={cn(
          "font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0",
          light ? "text-white" : "text-slate-900 dark:text-white"
        )}
      >
        VerityAI
      </span>
    </Link>
  );
}
