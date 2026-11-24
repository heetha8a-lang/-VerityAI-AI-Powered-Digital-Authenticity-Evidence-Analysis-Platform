"use client";

import { AlertCircle, FlaskConical, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ErrorNoticeCard({
  title,
  message,
  onRetry,
  onRunMock,
  busy = false,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  onRunMock?: () => void;
  busy?: boolean;
}) {
  return (
    <Card className="border-rose-200 dark:border-rose-900/60">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3 text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1.5 min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {message}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={onRetry}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Live Analysis</span>
          </Button>
          {onRunMock && (
            <Button
              type="button"
              variant="subtle"
              size="sm"
              disabled={busy}
              onClick={onRunMock}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Run Mock Prototype Instead</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
