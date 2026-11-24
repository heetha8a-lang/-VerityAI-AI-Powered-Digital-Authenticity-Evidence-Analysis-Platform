"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ReportView } from "@/components/ReportView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getInvestigationFromClientStore } from "@/lib/store";
import { investigationService } from "@/services/investigationService";
import { InvestigationRecord } from "@/types/investigation";

export default function InvestigationReportPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [record, setRecord] = React.useState<InvestigationRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFoundError, setNotFoundError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setNotFoundError(null);

      // First check client-persisted store (includes newly created live investigations)
      const localMatch = getInvestigationFromClientStore(id);
      if (localMatch) {
        if (!cancelled) {
          setRecord(localMatch);
          setLoading(false);
        }
        return;
      }

      // Otherwise fetch from REST endpoint GET /api/reports/{id}
      try {
        const remote = await investigationService.getReportById(id);
        if (!cancelled) {
          setRecord(remote);
        }
      } catch (err) {
        if (!cancelled) {
          setNotFoundError(
            err instanceof Error
              ? err.message
              : `Report '${id}' could not be located.`
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <AppShell
      breadcrumb={`Reports / ${id || "Detail"}`}
      action={
        <Link href="/history">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to History</span>
          </Button>
        </Link>
      }
    >
      {loading && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4 animate-pulse">
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-7 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7 h-56 animate-pulse" />
            <Card className="lg:col-span-5 h-56 animate-pulse" />
          </div>
        </div>
      )}

      {!loading && notFoundError && (
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              Investigation Report Not Found
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {notFoundError}
            </p>
            <div>
              <Link href="/history">
                <Button>Return to Investigation History</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && record && <ReportView record={record} />}
    </AppShell>
  );
}
