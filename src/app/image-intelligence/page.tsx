"use client";

import * as React from "react";
import Link from "next/link";
import {
  Download,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  ShieldAlert,
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
import { downloadInvestigationPdf } from "@/lib/pdfExport";
import { useInvestigations } from "@/lib/store";
import { formatBytes } from "@/lib/utils";
import { investigationService } from "@/services/investigationService";
import { InvestigationRecord } from "@/types/investigation";

interface PreparedImage {
  dataUrl: string;
  transportDataUrl: string;
  transportMimeType: string;
  mimeType: string;
  fileName: string;
  fileSize: string;
  dimensions: string;
  aspectRatio: string;
  exifStatus: string;
  lastModified?: string;
}

function computeAspectRatio(w: number, h: number): string {
  if (!w || !h) return "Unknown";
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(w, h);
  return `${Math.round(w / g)}:${Math.round(h / g)}`;
}

async function detectExifHeader(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  if (!mimeType.includes("jpeg") && !mimeType.includes("jpg")) {
    return `${mimeType} container (non-JPEG; EXIF camera tags typically absent)`;
  }
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
    return "JPEG header unverified";
  }
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset, false);
    if (marker === 0xffe1) {
      return "APP1 EXIF metadata segment present in file header";
    }
    if ((marker & 0xff00) !== 0xff00) break;
    const size = view.getUint16(offset + 2, false);
    if (size < 2) break;
    offset += 2 + size;
  }
  return "No EXIF camera metadata segment found (stripped or synthetic export)";
}

async function buildTransportImage(
  dataUrl: string,
  mimeType: string
): Promise<{ url: string; mime: string }> {
  if (dataUrl.length <= 2_200_000) {
    return { url: dataUrl, mime: mimeType };
  }
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const maxDim = 1600;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ url: dataUrl, mime: mimeType });
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ url: canvas.toDataURL("image/jpeg", 0.86), mime: "image/jpeg" });
    };
    img.onerror = () => resolve({ url: dataUrl, mime: mimeType });
    img.src = dataUrl;
  });
}

const SAMPLE_IMAGES = [
  {
    label: "Zurich Street Frame",
    url: "/images/sample_urban_street.jpg",
    fileName: "sample_urban_street.jpg",
  },
  {
    label: "Nordic Library Atrium",
    url: "/images/sample_architectural_atrium.jpg",
    fileName: "sample_architectural_atrium.jpg",
  },
];

const ANALYSIS_STEPS = [
  "Parsing container metadata and pixel dimensions...",
  "Evaluating shadow vectors, reflections, and perspective geometry...",
  "Screening compression residuals and generative texture patterns...",
  "Calibrating uncertainty bounds and compiling evidence summary...",
];

export default function ImageIntelligencePage() {
  const { addInvestigation } = useInvestigations();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [dragActive, setDragActive] = React.useState(false);
  const [prepared, setPrepared] = React.useState<PreparedImage | null>(null);
  const [userContext, setUserContext] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [stepIndex, setStepIndex] = React.useState(0);
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

  const loadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid PNG, JPEG, or WebP image file.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("Please choose an image smaller than 12 MB.");
      return;
    }

    setErrorMsg(null);
    setResult(null);

    const [dataUrl, arrayBuffer] = await Promise.all([
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(file);
      }),
      file.arrayBuffer(),
    ]);

    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = dataUrl;
    });

    const [exifStatus, transport] = await Promise.all([
      detectExifHeader(arrayBuffer, file.type),
      buildTransportImage(dataUrl, file.type),
    ]);

    setPrepared({
      dataUrl,
      transportDataUrl: transport.url,
      transportMimeType: transport.mime,
      mimeType: file.type,
      fileName: file.name,
      fileSize: formatBytes(file.size),
      dimensions: dims.w ? `${dims.w} × ${dims.h} px` : "Unknown",
      aspectRatio: computeAspectRatio(dims.w, dims.h),
      exifStatus,
      lastModified: file.lastModified
        ? new Date(file.lastModified).toISOString().slice(0, 10)
        : undefined,
    });
  };

  const loadSampleImage = async (sample: (typeof SAMPLE_IMAGES)[number]) => {
    try {
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const file = new File([blob], sample.fileName, {
        type: blob.type || "image/jpeg",
      });
      await loadFile(file);
      toast.success(`Loaded sample image: ${sample.label}`);
    } catch {
      toast.error("Could not load sample image.");
    }
  };

  const handleAnalyze = async (mode: "live" | "mock" = "live") => {
    if (!prepared) {
      toast.error("Upload or select an image before running analysis.");
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);
    setProgress(18);
    setStepIndex(0);

    const timer = window.setInterval(() => {
      setProgress((prev) => (prev < 86 ? prev + 14 : prev));
      setStepIndex((prev) =>
        prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 900);

    try {
      const record = await investigationService.analyzeImage({
        imageBase64: prepared.transportDataUrl,
        mimeType: prepared.transportMimeType,
        fileName: prepared.fileName,
        fileSize: prepared.fileSize,
        dimensions: prepared.dimensions,
        aspectRatio: prepared.aspectRatio,
        exifStatus: prepared.exifStatus,
        lastModified: prepared.lastModified,
        userContext,
        mode,
      });

      const recordWithPreview: InvestigationRecord = {
        ...record,
        previewImageUrl: prepared.dataUrl,
      };

      setProgress(100);
      setResult(recordWithPreview);
      addInvestigation(recordWithPreview);
      toast.success(`Image analysis completed (${record.id})`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Image analysis request failed.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      window.clearInterval(timer);
      setAnalyzing(false);
    }
  };

  return (
    <AppShell breadcrumb="Image Intelligence">
      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Image Intelligence
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Inspect photographs for visual consistency, metadata cues,
            compression anomalies, and generative indicators. VerityAI reports
            calibrated uncertainty rather than absolute real/fake verdicts.
          </p>
        </div>

        <EngineModeBar mode={engineMode} onChange={setEngineMode} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Upload & Input Column */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Submit Image for Inspection</CardTitle>
              <CardDescription>
                Drag and drop an image, browse local files, or load a sample
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
                  accept="image/png,image/jpeg,image/webp"
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
                  Drop PNG, JPEG, or WebP image here
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Maximum file size 10 MB
                </p>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                </div>
              </div>

              {/* Sample Presets */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Or test immediately with a sample photograph:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_IMAGES.map((sample) => (
                    <Button
                      key={sample.fileName}
                      type="button"
                      variant="subtle"
                      size="sm"
                      onClick={() => void loadSampleImage(sample)}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>{sample.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Preview & File Metadata */}
              {prepared && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                    <img
                      src={prepared.dataUrl}
                      alt={prepared.fileName}
                      referrerPolicy="no-referrer"
                      className="w-full max-h-56 object-contain mx-auto"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">File</p>
                      <p className="font-mono text-slate-900 dark:text-slate-100 truncate">
                        {prepared.fileName}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Size · Type</p>
                      <p className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {prepared.fileSize} · {prepared.mimeType.replace("image/", "").toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Dimensions</p>
                      <p className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {prepared.dimensions} ({prepared.aspectRatio})
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Header Scan</p>
                      <p className="text-slate-900 dark:text-slate-100 truncate" title={prepared.exifStatus}>
                        {prepared.exifStatus}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="image-context"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Context or Claim (Optional)
                </label>
                <Input
                  id="image-context"
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  placeholder="e.g., Claimed to be taken in Geneva yesterday"
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
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <span>Analyze Image</span>
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
                      Running Forensic &amp; Visual Consistency Inspection
                    </span>
                    <span className="font-mono tabular-nums text-xs text-slate-500">
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {ANALYSIS_STEPS[stepIndex]}
                  </p>
                </CardContent>
              </Card>
            )}

            {errorMsg && !analyzing && (
              <ErrorNoticeCard
                title="Image Analysis Unavailable"
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
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Ready for Image Inspection
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Upload an image or load one of the sample frames on the left,
                    then click Analyze Image to inspect visual consistency,
                    metadata, and calibrated uncertainty.
                  </p>
                </CardContent>
              </Card>
            )}

            {result?.imageResult && !analyzing && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {result.id} · {result.dataOrigin}
                      </p>
                      <CardTitle className="text-xl">
                        {result.title}
                      </CardTitle>
                      <VerdictDisplay
                        label={result.imageResult.overallAssessment}
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
                        <span>PDF</span>
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
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3">
                      <ShieldAlert className="h-4 w-4 text-slate-600 dark:text-slate-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Epistemic Safeguard: No single model prediction can
                        conclusively certify an image as authentic or fabricated.
                        Treat these signals alongside original source provenance.
                      </p>
                    </div>

                    <ConfidenceMeter
                      range={result.imageResult.confidenceRange}
                      note={result.imageResult.uncertaintySummary}
                    />

                    <div className="space-y-1.5">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Explanation of Findings
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {result.imageResult.explanation}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Manipulation Indicators & Visual Consistency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Possible Manipulation Indicators</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.imageResult.possibleManipulationIndicators.map(
                        (item, idx) => (
                          <div
                            key={idx}
                            className="pb-3 last:pb-0 border-b last:border-b-0 border-slate-100 dark:border-slate-800 space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {item.area}
                              </p>
                              <span className="text-[11px] font-mono capitalize text-slate-500">
                                {item.severity}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {item.observation}
                            </p>
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Visual Consistency Findings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.imageResult.visualConsistencyFindings.map(
                        (item, idx) => (
                          <div
                            key={idx}
                            className="pb-3 last:pb-0 border-b last:border-b-0 border-slate-100 dark:border-slate-800 space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {item.check}
                              </p>
                              <span className="text-[11px] font-mono capitalize text-slate-500">
                                {item.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {item.finding}
                            </p>
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* AI-Generated Indicators & Limitations */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      AI-Generated Content Indicators &amp; Limitations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.imageResult.aiGeneratedIndicators.map(
                        (aiInd, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-1"
                          >
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {aiInd.signal}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {aiInd.observation}
                            </p>
                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                              {aiInd.likelihoodNote}
                            </p>
                          </div>
                        )
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Known Limitations
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {result.imageResult.limitations.map((lim, i) => (
                          <li key={i}>{lim}</li>
                        ))}
                      </ul>
                    </div>
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
