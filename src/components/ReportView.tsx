"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  FileJson,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { ConfidenceMeter } from "@/components/ConfidenceMeter";
import { VerdictDisplay } from "@/components/VerdictDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadInvestigationPdf } from "@/lib/pdfExport";
import { formatTimestamp } from "@/lib/utils";
import { InvestigationRecord } from "@/types/investigation";

export function ReportView({ record }: { record: InvestigationRecord }) {
  const [showLimitations, setShowLimitations] = React.useState(true);
  const [showRawText, setShowRawText] = React.useState(false);

  const handleDownloadPdf = () => {
    try {
      downloadInvestigationPdf(record);
      toast.success(`Downloaded VerityAI-Report-${record.id}.pdf`);
    } catch {
      toast.error("Could not generate PDF report.");
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(record, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VerityAI-Report-${record.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${record.id} JSON payload`);
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(record.id);
      toast.success(`Copied Investigation ID ${record.id}`);
    } catch {
      toast.error("Unable to copy ID to clipboard");
    }
  };

  const confidenceRange =
    record.imageResult?.confidenceRange ||
    record.newsResult?.confidenceRange ||
    record.documentResult?.confidenceRange || {
      low: 60,
      high: 78,
      label: record.confidenceLabel,
    };

  return (
    <div className="space-y-6">
      {/* Report Header Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {record.id}
                </span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{record.type} Investigation</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {formatTimestamp(record.createdAt)}
                </span>
                <span aria-hidden="true">·</span>
                <span>{record.dataOrigin}</span>
              </div>

              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {record.title}
              </h1>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {record.submittedSummary}
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <VerdictDisplay
                  label={record.assessmentLabel}
                  category={record.assessmentCategory}
                />
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {record.confidenceLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button variant="outline" size="sm" onClick={handleCopyId}>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy ID</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJson}>
                <FileJson className="h-3.5 w-3.5" />
                <span>Export JSON</span>
              </Button>
              <Button size="sm" onClick={handleDownloadPdf}>
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submitted Artifact + Confidence & Uncertainty */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Submitted Content &amp; Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {record.previewImageUrl && (
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                <img
                  src={record.previewImageUrl}
                  alt={record.title}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-80 object-contain mx-auto"
                />
              </div>
            )}

            {record.newsResult && (
              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Original Claim Evaluated
                  </p>
                  <p className="mt-1.5 text-slate-900 dark:text-slate-100 leading-relaxed">
                    {record.newsResult.originalClaim}
                  </p>
                  {record.newsResult.sourceUrl && (
                    <a
                      href={record.newsResult.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                    >
                      <span>{record.newsResult.sourceUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  )}
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {record.newsResult.explanation}
                </p>
              </div>
            )}

            {record.imageResult && (
              <div className="space-y-3 text-sm">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {record.imageResult.explanation}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">File Name</p>
                    <p className="mt-0.5 font-mono text-slate-900 dark:text-slate-100 truncate">
                      {record.imageResult.metadataInfo.fileName}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Dimensions</p>
                    <p className="mt-0.5 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {record.imageResult.metadataInfo.dimensions}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">EXIF Status</p>
                    <p className="mt-0.5 text-slate-900 dark:text-slate-100">
                      {record.imageResult.metadataInfo.exifStatus}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {record.documentResult && (
              <div className="space-y-3 text-sm">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {record.documentResult.explanation}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">File</p>
                    <p className="mt-0.5 font-mono text-slate-900 dark:text-slate-100 truncate">
                      {record.documentResult.fileName}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Author / Org</p>
                    <p className="mt-0.5 text-slate-900 dark:text-slate-100 truncate">
                      {record.documentResult.documentMetadata.authorOrOrg}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Document Date</p>
                    <p className="mt-0.5 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {record.documentResult.documentMetadata.documentDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Pages (Est.)</p>
                    <p className="mt-0.5 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {record.documentResult.pageCountEstimate}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRawText((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {showRawText ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        <span>Hide Extracted Document Excerpt</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        <span>View Extracted Document Excerpt</span>
                      </>
                    )}
                  </button>
                  {showRawText && (
                    <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono text-slate-700 dark:text-slate-300">
                      {record.documentResult.extractedText}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Confidence &amp; Uncertainty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ConfidenceMeter
              range={confidenceRange}
              note={
                record.imageResult?.uncertaintySummary ||
                "Confidence intervals reflect corroboration density and model agreement rather than binary certainty."
              }
            />

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Analytical Modules Invoked
              </p>
              {record.modelFindings.map((mf, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-3 space-y-1"
                >
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {mf.module}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {mf.summary}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Uncertainty: {mf.uncertainty}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence &amp; Signals Table</CardTitle>
        </CardHeader>
        <CardContent>
          {record.evidenceTable.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No structured evidence rows recorded for this entry.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Verification Factor</TableHead>
                  <TableHead>Observed Evidence</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record.evidenceTable.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {row.factor}
                    </TableCell>
                    <TableCell className="max-w-xl leading-relaxed">
                      {row.observation}
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {row.signal}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs whitespace-nowrap">
                      {row.weight}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Source References */}
      <Card>
        <CardHeader>
          <CardTitle>Source References</CardTitle>
        </CardHeader>
        <CardContent>
          {record.sources.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No external web citations attached to this investigation (either visual-only forensics or unverified claim with no grounded sources found).
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {record.sources.map((src, i) => (
                <div
                  key={i}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {src.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{src.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {src.publishedDate}
                      </span>
                    </div>
                  </div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    <span>Open Source</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Limitations */}
      <Card>
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setShowLimitations((v) => !v)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <CardTitle>Methodology &amp; Limitations</CardTitle>
            </div>
            {showLimitations ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>
        </CardHeader>
        {showLimitations && (
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc pl-5">
              {record.limitations.map((lim, idx) => (
                <li key={idx} className="leading-relaxed">
                  {lim}
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
