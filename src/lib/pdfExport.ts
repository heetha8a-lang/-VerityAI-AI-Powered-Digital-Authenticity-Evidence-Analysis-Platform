"use client";

import { jsPDF } from "jspdf";
import { formatTimestamp } from "@/lib/utils";
import { InvestigationRecord } from "@/types/investigation";

export function downloadInvestigationPdf(record: InvestigationRecord): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const maxWidth = pageWidth - margin * 2;
  let y = 18;

  const ensureSpace = (needed = 14) => {
    if (y + needed > 278) {
      doc.addPage();
      y = 18;
    }
  };

  const addSectionTitle = (title: string) => {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  const addBodyText = (text: string, size = 9.5, muted = false) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(muted ? 71 : 30, muted ? 85 : 41, muted ? 105 : 59);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      ensureSpace(6);
      doc.text(line, margin, y);
      y += 4.8;
    }
    y += 2;
  };

  // Header band
  doc.setFillColor(11, 17, 32);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("VerityAI Investigation Report", margin, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Verify Information. Understand Evidence. Build Trust.", margin, 20);

  y = 38;

  // Metadata summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(record.title, maxWidth) as string[];
  for (const line of titleLines) {
    doc.text(line, margin, y);
    y += 6;
  }
  y += 2;

  addBodyText(
    `Investigation ID: ${record.id}   |   Type: ${record.type.toUpperCase()}   |   Timestamp: ${formatTimestamp(
      record.createdAt
    )}`,
    9,
    true
  );
  addBodyText(
    `Overall Assessment: ${record.assessmentLabel}   |   Confidence Estimate: ${record.confidenceLabel}   |   Engine: ${record.dataOrigin}`,
    9.5,
    false
  );

  // Submitted Content
  addSectionTitle("Submitted Content Summary");
  addBodyText(record.submittedSummary);

  if (record.newsResult) {
    addSectionTitle("Claim & Evidence Assessment");
    addBodyText(`Original Claim: ${record.newsResult.originalClaim}`);
    if (record.newsResult.sourceUrl) {
      addBodyText(`Submitted URL: ${record.newsResult.sourceUrl}`, 9, true);
    }
    addBodyText(`Explanation: ${record.newsResult.explanation}`);

    if (record.newsResult.supportingEvidence.length > 0) {
      addBodyText("Supporting Evidence:", 9.5, false);
      record.newsResult.supportingEvidence.forEach((ev) => addBodyText(`• ${ev}`, 9));
    }
    if (record.newsResult.contradictingEvidence.length > 0) {
      addBodyText("Contradicting or Nuance Evidence:", 9.5, false);
      record.newsResult.contradictingEvidence.forEach((ev) => addBodyText(`• ${ev}`, 9));
    }
  }

  if (record.imageResult) {
    addSectionTitle("Image Authenticity & Consistency Findings");
    addBodyText(record.imageResult.explanation);
    addBodyText(
      `Metadata: ${record.imageResult.metadataInfo.fileName} (${record.imageResult.metadataInfo.dimensions}, ${record.imageResult.metadataInfo.fileSize}, ${record.imageResult.metadataInfo.mimeType}) — EXIF: ${record.imageResult.metadataInfo.exifStatus}`,
      9,
      true
    );
    addBodyText(`Uncertainty Note: ${record.imageResult.uncertaintySummary}`, 9, true);
  }

  if (record.documentResult) {
    addSectionTitle("Document Analysis & Key Claims");
    addBodyText(record.documentResult.overallAssessment);
    addBodyText(record.documentResult.explanation);
    record.documentResult.keyClaims.forEach((claim) => {
      addBodyText(
        `[${claim.status}] (${claim.section}) ${claim.claim} — ${claim.verificationNote}`,
        9
      );
    });
  }

  // Evidence Table
  if (record.evidenceTable.length > 0) {
    addSectionTitle("Evidence Breakdown");
    record.evidenceTable.forEach((row) => {
      addBodyText(
        `${row.factor} [${row.signal} · ${row.weight}]: ${row.observation}`,
        9
      );
    });
  }

  // Model Findings
  if (record.modelFindings.length > 0) {
    addSectionTitle("Model & Pipeline Findings");
    record.modelFindings.forEach((mf) => {
      addBodyText(`${mf.module}: ${mf.summary} (Uncertainty: ${mf.uncertainty})`, 9);
    });
  }

  // Sources
  if (record.sources.length > 0) {
    addSectionTitle("Source References");
    record.sources.forEach((src, i) => {
      addBodyText(
        `${i + 1}. ${src.name} — ${src.title} (${src.publishedDate})\n   ${src.url}`,
        8.5
      );
    });
  }

  // Limitations
  if (record.limitations.length > 0) {
    addSectionTitle("Limitations & Epistemic Notice");
    record.limitations.forEach((lim) => {
      addBodyText(`• ${lim}`, 8.8, true);
    });
  }

  doc.save(`VerityAI-Report-${record.id}.pdf`);
}
