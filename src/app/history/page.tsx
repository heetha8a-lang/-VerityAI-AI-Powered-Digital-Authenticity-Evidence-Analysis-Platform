"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { VerdictDisplay } from "@/components/VerdictDisplay";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SegmentedTabs } from "@/components/ui/tabs";
import { useInvestigations } from "@/lib/store";
import { formatTimestamp } from "@/lib/utils";
import { InvestigationType } from "@/types/investigation";

export default function HistoryPage() {
  const { investigations, resetToBaseline } = useInvestigations();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<InvestigationType | "all">(
    "all"
  );
  const [originFilter, setOriginFilter] = React.useState<
    "all" | "live" | "sample"
  >("all");

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return investigations.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (
        originFilter === "live" &&
        item.dataOrigin !== "Live Gemini Prototype"
      ) {
        return false;
      }
      if (
        originFilter === "sample" &&
        item.dataOrigin !== "Sample Baseline (Mock)"
      ) {
        return false;
      }
      if (!q) return true;
      const haystack =
        `${item.id} ${item.title} ${item.submittedSummary} ${item.assessmentLabel}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [investigations, searchQuery, typeFilter, originFilter]);

  return (
    <AppShell
      breadcrumb="Investigation History"
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetToBaseline();
            toast.success("Restored sample baseline investigation dataset.");
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Sample Data</span>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Investigation History
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Search and filter past image, news, document, and claim
            investigations or inspect any full report.
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative w-full lg:max-w-sm">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ID, title, claim, or verdict..."
                  className="pl-9"
                  aria-label="Search investigations"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <SegmentedTabs
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={[
                    { value: "all", label: "All Types" },
                    { value: "image", label: "Image" },
                    { value: "news", label: "News" },
                    { value: "document", label: "Document" },
                    { value: "text", label: "Text" },
                  ]}
                />

                <SegmentedTabs
                  value={originFilter}
                  onChange={setOriginFilter}
                  options={[
                    { value: "all", label: "All Sources" },
                    { value: "live", label: "Live Runs" },
                    { value: "sample", label: "Sample Mock" },
                  ]}
                />
              </div>
            </div>
            <CardDescription className="font-mono tabular-nums text-xs">
              Showing {filtered.length} of {investigations.length} investigations
            </CardDescription>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  No investigations match your current filters
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Try clearing your search query or switching back to All Types.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                    setOriginFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investigation ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject &amp; Summary</TableHead>
                    <TableHead>Date &amp; Status</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {item.id}
                      </TableCell>
                      <TableCell className="capitalize text-xs whitespace-nowrap">
                        {item.type}
                      </TableCell>
                      <TableCell className="max-w-sm">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {item.submittedSummary}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <p className="font-mono tabular-nums text-xs text-slate-900 dark:text-slate-100">
                          {formatTimestamp(item.createdAt)}
                        </p>
                        <p className="text-[11px] capitalize text-slate-500">
                          {item.status}
                        </p>
                      </TableCell>
                      <TableCell>
                        <VerdictDisplay
                          label={item.assessmentLabel}
                          category={item.assessmentCategory}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {item.dataOrigin}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Link href={`/reports/${item.id}`}>
                          <Button variant="outline" size="sm">
                            View Detailed Report
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
