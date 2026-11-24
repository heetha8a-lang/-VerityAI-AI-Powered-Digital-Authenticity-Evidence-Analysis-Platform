"use client";

import * as React from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ConfidenceMeter } from "@/components/ConfidenceMeter";
import {
  AnalysisEngineMode,
  EngineModeBar,
} from "@/components/EngineModeBar";
import { ErrorNoticeCard } from "@/components/ErrorNoticeCard";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { verdictToCategory } from "@/lib/groundingParser";
import { downloadInvestigationPdf } from "@/lib/pdfExport";
import { useInvestigations } from "@/lib/store";
import { formatBytes } from "@/lib/utils";
import { investigationService } from "@/services/investigationService";
import { InvestigationRecord } from "@/types/investigation";

interface PreparedDocument {
  fileName: string;
  fileSize: string;
  mimeType: string;
  pdfBase64?: string;
  previewBlobUrl?: string;
  textFallback?: string;
}

const DOC_STEPS = [
  "Reading PDF stream and document container metadata...",
  "Extracting text sections and structural headings...",
  "Identifying verifiable factual claims and internal inconsistencies...",
  "Cross-referencing external context and generating audit report...",
];

export default function DocumentIntelligencePage() {
  const { addInvestigation } = useInvestigations();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [dragActive, setDragActive] = React.useState(false);
  const [prepared, setPrepared] = React.useState<PreparedDocument | null>(null);
  const [focusContext, setFocusContext] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<InvestigationRecord | null>(null);
  const [engineMode, setEngineMode] = React.useState<AnalysisEngineMode>("live");

  React.useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d: { geminiConfigured?: boolean }) => {
        if (d.geminiConfigured === false) setEngineMode("mock");
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    return () => {
      if (prepared?.previewBlobUrl) {
        URL.revokeObjectURL(prepared.previewBlobUrl);
      }
    };
  }, [prepared?.previewBlobUrl]);

  const loadFile = async (file: File) => {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    const isText =
      file.type.startsWith("text/") ||
      file.name.toLowerCase().endsWith(".txt") ||
      file.name.toLowerCase().endsWith(".md");

    if (!isPdf && !isText) {
      toast.error("Please select a PDF (.pdf) or plain text (.txt/.md) file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Please upload a document smaller than 10 MB.");
      return;
    }

    setErrorMsg(null);
    setResult(null);

    if (isPdf) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read PDF file."));
        reader.readAsDataURL(file);
      });
      const blobUrl = URL.createObjectURL(file);
      setPrepared({
        fileName: file.name,
        fileSize: formatBytes(file.size),
        mimeType: "application/pdf",
        pdfBase64: dataUrl,
        previewBlobUrl: blobUrl,
      });
    } else {
      const text = await file.text();
      setPrepared({
        fileName: file.name,
        fileSize: formatBytes(file.size),
        mimeType: file.type || "text/plain",
        textFallback: text,
      });
    }
  };

  const loadSampleBriefPdf = async () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Global Urban Cooling & Reflective Roofs Brief (2025)", 16, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const body = [
      "Author: Urban Climate Research Consortium | Published: October 2025",
      "",
      "1. Executive Summary:",
      "High-albedo reflective roof coatings deployed across pilot commercial districts",
      "reduced peak rooftop surface temperatures by 14 to 22 degrees Celsius compared",
      "with dark bituminous membranes during summer heatwaves.",
      "",
      "2. Energy & Cost Claims:",
      "Section 2.1 projects an average 18% annual cooling electricity reduction for",
      "single-story warehouses in sun-belt climates. However, Section 3.4 notes that",
      "multi-story buildings in cold winter climates experienced a 4% winter heating",
      "penalty that partially offsets annual net HVAC savings.",
      "",
      "3. Scope Limitations:",
      "Pilot telemetry covered 38 commercial roofs over 14 months without long-term",
      "membrane weathering calibration beyond Year 2.",
    ];
    let y = 32;
    for (const line of body) {
      doc.text(line, 16, y);
      y += 6;
    }

    const blob = doc.output("blob");
    const file = new File([blob], "Urban_Cooling_Reflective_Roofs_Brief.pdf", {
      type: "application/pdf",
    });
    await loadFile(file);
    toast.success("Generated and loaded sample PDF brief.");
  };

  const handleAnalyze = async (mode: "live" | "mock" = "live") => {
    if (!prepared) {
      toast.error("Please upload a PDF document or load the sample brief first.");
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);
    setProgress(18);
    setStepIdx(0);

    const timer = window.setInterval(() => {
      setProgress((prev) => (prev < 88 ? prev + 14 : prev));
      setStepIdx((prev) => (prev < DOC_STEPS.length - 1 ? prev + 1 : prev));
    }, 950);

    try {
      const record = await investigationService.analyzeDocument({
        fileName: prepared.fileName,
        fileSize: prepared.fileSize,
        mimeType: prepared.mimeType,
        pdfBase64: prepared.pdfBase64,
        extractedTextFallback: prepared.textFallback,
        userContext: focusContext,
        mode,
      });

      setProgress(100);
      setResult(record);
      addInvestigation(record);
      toast.success(`Document audit completed (${record.id})`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Document analysis failed.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      window.clearInterval(timer);
      setAnalyzing(false);
    }
  };

  return (
    <AppShell breadcrumb="Document Intelligence">
      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Document Intelligence
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Upload PDF reports, whitepapers, or policy memos to extract text,
            inspect document metadata, audit key claims, and compare findings
            against external context.
          </p>
        </div>

        <EngineModeBar mode={engineMode} onChange={setEngineMode} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Upload & Preview Column */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Upload PDF Document</CardTitle>
              <CardDescription>
                Preview your PDF and inspect extracted metadata before analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void loadFile(file);
                }}
                className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void loadFile(file);
                  }}
                />
                <div className="mx-auto h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                  Drop PDF file here or browse
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Supports .pdf up to 12 MB (plus .txt/.md)
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                  <Button
                    type="button"
                    variant="subtle"
                    size="sm"
                    onClick={() => void loadSampleBriefPdf()}
                  >
                    Load Sample PDF Brief
                  </Button>
                </div>
              </div>

              {prepared && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-medium text-slate-900 dark:text-slate-100 truncate">
                      {prepared.fileName}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500 shrink-0">
                      {prepared.fileSize}
                    </span>
                  </div>

                  {prepared.previewBlobUrl ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 h-72">
                      <iframe
                        src={prepared.previewBlobUrl}
                        title="PDF Document Preview"
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono text-slate-700 dark:text-slate-300">
                      {prepared.textFallback}
                    </pre>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="doc-focus"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Verification Focus (Optional)
                </label>
                <Input
                  id="doc-focus"
                  value={focusContext}
                  onChange={(e) => setFocusContext(e.target.value)}
                  placeholder="e.g., Check cost savings claims and footnote caveats"
                />
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={!prepared || analyzing}
                onClick={() => void handleAnalyze(engineMode)}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <span>Analyze Document</span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-6">
            {analyzing && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      Extracting Text &amp; Auditing Claims
                    </span>
                    <span className="font-mono tabular-nums text-xs text-slate-500">
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {DOC_STEPS[stepIdx]}
                  </p>
                </CardContent>
              </Card>
            )}

            {errorMsg && !analyzing && (
              <ErrorNoticeCard
                title="Document Analysis Error"
                message={errorMsg}
                busy={analyzing}
                onRetry={() => void handleAnalyze("live")}
                onRunMock={() => {
                  setEngineMode("mock");
                  void handleAnalyze("mock");
                }}
              />
            )}

            {!analyzing && !result && !errorMsg && (
              <Card>
                <CardContent className="p-10 text-center space-y-3">
                  <div className="mx-auto h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Ready for Document Inspection
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Upload a PDF or generate the sample brief on the left, then
                    click Analyze Document to view extracted text, metadata,
                    claims, and cross-check comparisons.
                  </p>
                </CardContent>
              </Card>
            )}

            {result?.documentResult && !analyzing && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {result.id} · {result.dataOrigin}
                      </p>
                      <CardTitle className="text-xl">{result.title}</CardTitle>
                      <VerdictDisplay
                        label={result.documentResult.overallAssessment}
                        category={result.assessmentCategory}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvestigationPdf(result)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Report</span>
                      </Button>
                      <Link href={`/reports/${result.id}`}>
                        <Button size="sm">
                          <span>Full Report</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <ConfidenceMeter
                      range={result.documentResult.confidenceRange}
                    />
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {result.documentResult.explanation}
                    </p>

                    {/* Document Metadata */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">
                          Author / Org
                        </p>
                        <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                          {result.documentResult.documentMetadata.authorOrOrg}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Date</p>
                        <p className="mt-0.5 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {result.documentResult.documentMetadata.documentDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Type</p>
                        <p className="mt-0.5 text-slate-900 dark:text-slate-100">
                          {result.documentResult.documentMetadata.documentType}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">
                          Est. Pages / Words
                        </p>
                        <p className="mt-0.5 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {result.documentResult.pageCountEstimate} pp ·{" "}
                          {result.documentResult.documentMetadata.wordCount} w
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Extracted Text */}
                <Card>
                  <CardHeader>
                    <CardTitle>Extracted Text</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
                      {result.documentResult.extractedText}
                    </pre>
                  </CardContent>
                </Card>

                {/* Key Claims Extraction */}
                <Card>
                  <CardHeader>
                    <CardTitle>Key Claims Extraction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.documentResult.keyClaims.map((k) => (
                      <div
                        key={k.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-mono text-slate-500">
                            {k.id} · {k.section}
                          </span>
                          <VerdictDisplay
                            label={k.status}
                            category={verdictToCategory(k.status)}
                          />
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {k.claim}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {k.verificationNote}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Comparison Findings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Comparison Findings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Topic</TableHead>
                          <TableHead>Document Position</TableHead>
                          <TableHead>External / Footnote Context</TableHead>
                          <TableHead className="text-right">Alignment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.documentResult.comparisonFindings.map(
                          (cf, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                {cf.topic}
                              </TableCell>
                              <TableCell className="text-xs leading-relaxed">
                                {cf.documentPosition}
                              </TableCell>
                              <TableCell className="text-xs leading-relaxed">
                                {cf.externalContext}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs whitespace-nowrap">
                                {cf.alignment}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
