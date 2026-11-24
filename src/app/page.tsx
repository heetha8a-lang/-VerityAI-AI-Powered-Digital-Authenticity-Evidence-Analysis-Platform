"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  FileText,
  Image as ImageIcon,
  Layers,
  Newspaper,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { VerityLogo } from "@/components/VerityLogo";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const PIPELINE_MODES = [
  {
    id: "image",
    label: "Image Forensics",
    sampleTitle: "Zurich Street Frame · EXIF & Shadow Audit",
    checks: [
      "Directional shadow & specular reflection alignment",
      "JPEG quantization & localized splice screening",
      "Calibrated uncertainty band: 68%–82% (non-binary)",
    ],
  },
  {
    id: "news",
    label: "News & Claims",
    sampleTitle: "Grid Capacity Claim · Grounded Retrieval",
    checks: [
      "Atomic claim extraction from article URL or text",
      "Cross-referenced supporting & contradicting sources",
      "Transparent verdict: Supported / Contradicted / Misleading / Unverified",
    ],
  },
  {
    id: "document",
    label: "Document Audit",
    sampleTitle: "Municipal Transit Brief.pdf · Section Audit",
    checks: [
      "Verbatim text & metadata extraction from PDF",
      "Executive claim vs. footnote scope comparison",
      "Exportable structured PDF investigation report",
    ],
  },
] as const;

export default function LandingPage() {
  const [activePipeline, setActivePipeline] = React.useState<"image" | "news" | "document">("image");
  const [modalType, setModalType] = React.useState<"privacy" | "contact" | "about" | null>(null);
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactMessage, setContactMessage] = React.useState("");

  const selectedStage =
    PIPELINE_MODES.find((m) => m.id === activePipeline) ?? PIPELINE_MODES[0];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.includes("@") || contactMessage.trim().length < 5) {
      toast.error("Please enter a valid email address and message.");
      return;
    }
    toast.success("Message recorded for the VerityAI team.");
    setContactEmail("");
    setContactMessage("");
    setModalType(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Top Bar Contract: 3 clean zones */}
      <header className="sticky top-0 z-40 bg-[#0B1120]/95 backdrop-blur-sm border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <VerityLogo href="/" light />

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
          >
            <a
              href="#features"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <Link
              href="/dashboard"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Dashboard
            </Link>
            <Link
              href="/history"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              History
            </Link>
          </nav>

          <div className="flex items-center shrink-0">
            <Link href="/dashboard">
              <Button size="sm" className="px-4">
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Dark Navy Hero Section */}
      <section className="bg-[#0B1120] text-white border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col justify-center space-y-6"
            >
              <p className="text-xs font-medium tracking-wide text-indigo-300">
                Verify Information · Understand Evidence · Build Trust
              </p>

              <h1
                className="font-display font-bold tracking-tight text-white leading-[1.08] max-w-xl"
                style={{
                  fontSize: "clamp(2.25rem, 4vw, 3.65rem)",
                  textWrap: "balance",
                }}
              >
                Trust What You See. Verify What You Read.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                VerityAI examines images, news articles, PDF reports, and viral
                claims—surfacing concrete evidence, source comparisons, and
                calibrated uncertainty instead of opaque black-box scores.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link href="/dashboard">
                  <Button size="lg">
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-800 hover:text-white"
                  >
                    <span>Explore Features</span>
                  </Button>
                </a>
              </div>

              <div className="pt-4 grid grid-cols-3 gap-6 border-t border-slate-800/80 text-sm">
                <div>
                  <p className="font-mono tabular-nums text-lg font-semibold text-white">
                    4 Modalities
                  </p>
                  <p className="text-xs text-slate-400">
                    Images, URLs, PDFs &amp; Claims
                  </p>
                </div>
                <div>
                  <p className="font-mono tabular-nums text-lg font-semibold text-white">
                    4 Verdicts
                  </p>
                  <p className="text-xs text-slate-400">
                    Evidence-backed classification
                  </p>
                </div>
                <div>
                  <p className="font-mono tabular-nums text-lg font-semibold text-white">
                    PDF &amp; JSON
                  </p>
                  <p className="text-xs text-slate-400">
                    Exportable audit reports
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Interactive AI Analysis Preview Card */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col rounded-xl border border-slate-800 bg-[#11192E] overflow-hidden"
            >
              <div className="relative h-56 sm:h-64 w-full bg-slate-950 overflow-hidden border-b border-slate-800">
                <img
                  src="/images/hero_verity_forensics.jpg"
                  alt="VerityAI optical and textual evidence inspection lattice"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#11192E] via-[#11192E]/30 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-medium text-slate-200">
                    Interactive Inspection Pipeline Preview
                  </p>
                  <div className="inline-flex items-center gap-1 rounded-lg bg-slate-950/85 p-1 border border-slate-800">
                    {PIPELINE_MODES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setActivePipeline(m.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          activePipeline === m.id
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <p className="font-mono text-xs text-indigo-300">
                    {selectedStage.sampleTitle}
                  </p>
                  <ul className="space-y-2.5">
                    {selectedStage.checks.map((line, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-slate-200"
                      >
                        <CheckCircle2
                          className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-400">
                    Run live analysis on your own files or claims
                  </span>
                  <Link
                    href={
                      activePipeline === "image"
                        ? "/image-intelligence"
                        : activePipeline === "news"
                        ? "/news-intelligence"
                        : "/document-intelligence"
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-white whitespace-nowrap shrink-0"
                  >
                    <span>Open {selectedStage.label}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Four Feature Cards (Asymmetric Bento Grid) */}
      <section id="features" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              Four Specialized Verification Modules
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Every media format fails in different ways. VerityAI routes each
              submission to dedicated inspection workflows rather than forcing a
              single score across unrelated evidence types.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Feature 1 */}
            <div className="md:col-span-7 rounded-xl border border-slate-200 bg-white p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold text-slate-900">
                  01. Image Authenticity Analysis
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  Inspect uploaded photographs for shadow and reflection coherence,
                  perspective consistency, compression anomalies, EXIF metadata
                  presence, and generative texture cues—paired with explicit
                  uncertainty bounds.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Supports PNG, JPEG, WebP · Client metadata inspection
                </span>
                <Link
                  href="/image-intelligence"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                >
                  <span>Analyze Image</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="md:col-span-5 rounded-xl border border-slate-200 bg-white p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Newspaper className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold text-slate-900">
                  02. News &amp; Claim Verification
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Paste an article URL or manual statement. VerityAI extracts
                  atomic claims and cross-checks retrieved web sources to return{" "}
                  Supported, Contradicted, Misleading, or Unverified verdicts.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Real grounded links only
                </span>
                <Link
                  href="/news-intelligence"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                >
                  <span>Verify Claim</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="md:col-span-5 rounded-xl border border-slate-200 bg-white p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold text-slate-900">
                  03. Document Intelligence
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Upload PDF briefs, reports, or whitepapers to extract text,
                  document metadata, key factual claims, internal discrepancies,
                  and exportable verification summaries.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  PDF &amp; text extraction
                </span>
                <Link
                  href="/document-intelligence"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                >
                  <span>Inspect PDF</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="md:col-span-7 rounded-xl border border-slate-200 bg-white p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                  <Scale className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold text-slate-900">
                  04. Explainable AI &amp; Calibrated Uncertainty
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  Every report separates direct observations, supporting vs.
                  contradicting evidence, confidence intervals, and explicit
                  methodological limitations—never disguising single-model guesses
                  as absolute truth.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Structured evidence tables + PDF export
                </span>
                <Link
                  href="/reports/VR-2026-0142"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                >
                  <span>View Sample Report</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              How It Works
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              A structured three-stage verification workflow built for clarity,
              traceability, and seamless integration with dedicated Python ML
              pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <p className="font-mono text-xs font-medium text-indigo-600">01</p>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Submit Artifact or Claim
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload an image or PDF document, paste a news article URL, or
                enter a specific claim you want cross-checked.
              </p>
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <p className="font-mono text-xs font-medium text-indigo-600">02</p>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Multi-Signal Evidence Analysis
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Requests route through modular API endpoints (/api/investigations/*)
                for metadata parsing, visual consistency checks, claim extraction,
                and grounded source retrieval.
              </p>
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <p className="font-mono text-xs font-medium text-indigo-600">03</p>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Review Evidence &amp; Export Report
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Inspect supporting vs. contradicting citations, confidence ranges,
                and model limitations, then download a formatted PDF report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why VerityAI */}
      <section className="py-20 bg-[#0B1120] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <h2 className="font-display text-3xl font-bold tracking-tight text-white">
                Why VerityAI
              </h2>
              <p className="text-base text-slate-300 leading-relaxed">
                Most verification tools present an unexplained percentage score.
                VerityAI is engineered around transparent evidence inspection so
                journalists, researchers, and everyday readers can judge the basis
                for every conclusion.
              </p>
              <div className="pt-2">
                <Link href="/dashboard">
                  <Button size="lg">
                    <span>Open Verification Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="rounded-xl border border-slate-800 bg-[#11192E] p-5 space-y-2">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                <h3 className="font-display text-base font-semibold text-white">
                  No Overstated Certainty
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Visual detectors never proclaim an image definitively real or
                  fake from a single pass; limitations remain front and center.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#11192E] p-5 space-y-2">
                <FileSearch className="h-5 w-5 text-sky-400" />
                <h3 className="font-display text-base font-semibold text-white">
                  Zero Fabricated Citations
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Source references in live investigations come strictly from
                  retrieved web grounding metadata—never invented links.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#11192E] p-5 space-y-2 sm:col-span-2">
                <Layers className="h-5 w-5 text-violet-400" />
                <h3 className="font-display text-base font-semibold text-white">
                  Decoupled FastAPI-Ready Architecture
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Built on Next.js App Router with typed service adapters targeting
                  /api/investigations/* so PyTorch, Hugging Face, OpenCV, and OCR
                  microservices plug in without UI rewrites.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <VerityLogo href="/" light />
            <p className="text-xs text-slate-500">
              Verify Information. Understand Evidence. Build Trust.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <button
              type="button"
              onClick={() => setModalType("about")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <button
              type="button"
              onClick={() => setModalType("privacy")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => setModalType("contact")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contact
            </button>
          </div>
        </div>
      </footer>

      {/* Footer Information Modals */}
      <Dialog
        open={modalType === "about"}
        onClose={() => setModalType(null)}
        title="About VerityAI"
        description="Digital authenticity and evidence analysis platform."
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          VerityAI helps everyday readers, researchers, and analysts inspect
          images, claims, news articles, and PDF documents using transparent
          evidence breakdowns. Its Next.js frontend is architected with clean
          service adapters ready for Python FastAPI, PyTorch, OpenCV, and OCR
          pipelines.
        </p>
      </Dialog>

      <Dialog
        open={modalType === "privacy"}
        onClose={() => setModalType(null)}
        title="Privacy & Data Handling"
        description="How submitted artifacts are processed in this prototype."
      >
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Uploaded images, PDFs, and claims are sent only to the configured
            verification API endpoint during active analysis.
          </p>
          <p>
            Investigation history created in your browser is stored locally in
            browser storage so you can revisit and export reports across
            sessions.
          </p>
        </div>
      </Dialog>

      <Dialog
        open={modalType === "contact"}
        onClose={() => setModalType(null)}
        title="Contact VerityAI"
        description="Questions about API integration or verification methodology."
      >
        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="contact-email"
              className="text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Email Address
            </label>
            <Input
              id="contact-email"
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="analyst@organization.org"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="contact-message"
              className="text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Message
            </label>
            <Textarea
              id="contact-message"
              required
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Share feedback or inquiry details..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalType(null)}
            >
              Cancel
            </Button>
            <Button type="submit">Send Message</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
