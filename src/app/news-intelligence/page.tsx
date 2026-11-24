"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Newspaper,
  XCircle,
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
import { Textarea } from "@/components/ui/textarea";
import { normalizeUrlInput, verdictToCategory } from "@/lib/groundingParser";
import { downloadInvestigationPdf } from "@/lib/pdfExport";
import { useInvestigations } from "@/lib/store";
import { formatTimestamp } from "@/lib/utils";
import { investigationService } from "@/services/investigationService";
import { InvestigationRecord } from "@/types/investigation";

const SAMPLE_CLAIMS = [
  {
    label: "Renewable Capacity Share",
    claim:
      "Renewable energy accounted for more than 80% of net new global electricity capacity additions in 2024.",
    url: "",
  },
  {
    label: "Voyager 1 Distance",
    claim:
      "NASA's Voyager 1 spacecraft is currently operating more than 24 billion kilometers from Earth in interstellar space.",
    url: "https://science.nasa.gov/mission/voyager/",
  },
  {
    label: "Battery Exaggeration Test",
    claim:
      "Commercial smartphones with 30-day battery life and 2-minute full charging are shipping globally from major manufacturers.",
    url: "",
  },
];

const VERIFY_STEPS = [
  "Parsing article URL and normalizing claim wording...",
  "Decomposing submission into atomic verifiable claims...",
  "Querying live search grounding for primary institutional sources...",
  "Comparing supporting vs. contradicting evidence and timestamps...",
];

export default function NewsIntelligencePage() {
  const { addInvestigation } = useInvestigations();

  const [articleUrl, setArticleUrl] = React.useState("");
  const [claimText, setClaimText] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
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

  const runVerification = async (mode: "live" | "mock" = "live") => {
    const rawUrl = articleUrl.trim();
    const trimmedUrl = rawUrl ? normalizeUrlInput(rawUrl) : "";
    const trimmedClaim = claimText.trim();

    if (!trimmedUrl && !trimmedClaim) {
      toast.error("Please enter a news article URL, a claim statement, or both.");
      return;
    }

    if (trimmedUrl) {
      try {
        new URL(trimmedUrl);
      } catch {
        toast.error("Enter a valid URL such as https://example.org/article");
        return;
      }
    }

    setVerifying(true);
    setErrorMsg(null);
    setResult(null);
    setProgress(20);
    setStepIdx(0);

    const timer = window.setInterval(() => {
      setProgress((prev) => (prev < 88 ? prev + 14 : prev));
      setStepIdx((prev) =>
        prev < VERIFY_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 950);

    try {
      const record = trimmedUrl
        ? await investigationService.analyzeNews({
            url: trimmedUrl,
            claimText: trimmedClaim || undefined,
            mode,
          })
        : await investigationService.analyzeText({
            claimText: trimmedClaim,
            mode,
          });

      setProgress(100);
      setResult(record);
      addInvestigation(record);
      toast.success(`Verification complete: ${record.assessmentLabel} (${record.id})`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to verify claim.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      window.clearInterval(timer);
      setVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runVerification(engineMode);
  };

  return (
    <AppShell breadcrumb="News Intelligence">
      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            News &amp; Claim Intelligence
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Submit a news article URL or claim statement. VerityAI extracts
            verifiable assertions, retrieves real web references, and classifies
            claims as Supported, Contradicted, Misleading, or Unverified.
          </p>
        </div>

        <EngineModeBar mode={engineMode} onChange={setEngineMode} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Column */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Submit URL or Claim</CardTitle>
              <CardDescription>
                Provide an article link, a statement to verify, or both
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="news-url"
                    className="text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    News Article URL (Optional)
                  </label>
                  <Input
                    id="news-url"
                    type="url"
                    value={articleUrl}
                    onChange={(e) => setArticleUrl(e.target.value)}
                    placeholder="https://example.org/news/article"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="claim-textarea"
                    className="text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Claim or Statement
                  </label>
                  <Textarea
                    id="claim-textarea"
                    value={claimText}
                    onChange={(e) => setClaimText(e.target.value)}
                    placeholder="Enter a factual statement, headline, or excerpt to fact-check..."
                    className="min-h-[130px]"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Load an example claim:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_CLAIMS.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="subtle"
                        size="sm"
                        onClick={() => {
                          setClaimText(preset.claim);
                          setArticleUrl(preset.url);
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifying}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Evidence...</span>
                    </>
                  ) : (
                    <span>Verify Claim</span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Output Column */}
          <div className="lg:col-span-7 space-y-6">
            {verifying && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      Running Grounded Claim Verification
                    </span>
                    <span className="font-mono tabular-nums text-xs text-slate-500">
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {VERIFY_STEPS[stepIdx]}
                  </p>
                </CardContent>
              </Card>
            )}

            {errorMsg && !verifying && (
              <ErrorNoticeCard
                title="Verification Error"
                message={errorMsg}
                busy={verifying}
                onRetry={() => void runVerification("live")}
                onRunMock={() => {
                  setEngineMode("mock");
                  void runVerification("mock");
                }}
              />
            )}

            {!verifying && !result && !errorMsg && (
              <Card>
                <CardContent className="p-10 text-center space-y-3">
                  <div className="mx-auto h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <Newspaper className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Ready to Verify Claims &amp; Articles
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Submit a claim or article URL on the left to inspect
                    extracted sub-claims, supporting vs. contradicting evidence,
                    and real source references.
                  </p>
                </CardContent>
              </Card>
            )}

            {result?.newsResult && !verifying && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{result.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatTimestamp(result.newsResult.analysisTimestamp)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{result.dataOrigin}</span>
                      </div>
                      <CardTitle className="text-xl">{result.title}</CardTitle>
                      <VerdictDisplay
                        label={result.newsResult.assessment}
                        category={verdictToCategory(result.newsResult.assessment)}
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
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Original Claim
                      </p>
                      <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
                        {result.newsResult.originalClaim}
                      </p>
                    </div>

                    <ConfidenceMeter range={result.newsResult.confidenceRange} />

                    <div className="space-y-1.5">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Evidence Synthesis
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {result.newsResult.explanation}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Supporting vs Contradicting Evidence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Supporting Evidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.newsResult.supportingEvidence.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No supporting evidence observed in retrieved sources.
                        </p>
                      ) : (
                        <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                          {result.newsResult.supportingEvidence.map((ev, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{ev}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Contradicting &amp; Context Evidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.newsResult.contradictingEvidence.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No contradicting evidence flagged in retrieved sources.
                        </p>
                      ) : (
                        <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                          {result.newsResult.contradictingEvidence.map(
                            (ev, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{ev}</span>
                              </li>
                            )
                          )}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Extracted Claims */}
                {result.newsResult.extractedClaims.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Extracted Claims Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.newsResult.extractedClaims.map((clm) => (
                        <div
                          key={clm.id}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-xs text-slate-500">
                              {clm.id}
                            </span>
                            <VerdictDisplay
                              label={clm.assessment}
                              category={verdictToCategory(clm.assessment)}
                            />
                          </div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {clm.claim}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {clm.rationale}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Grounded Source References */}
                <Card>
                  <CardHeader>
                    <CardTitle>Retrieved Source References</CardTitle>
                    <CardDescription>
                      Verified links returned directly by search retrieval
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.newsResult.sources.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No external URLs returned by retrieval for this query.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {result.newsResult.sources.map((src, idx) => (
                          <div
                            key={idx}
                            className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {src.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {src.name} · {src.publishedDate}
                              </p>
                            </div>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
                            >
                              <span>Visit Source</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Limitations
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {result.newsResult.limitations.map((lim, i) => (
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
