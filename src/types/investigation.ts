export type InvestigationType = "image" | "news" | "document" | "text";

export type InvestigationStatus = "completed" | "processing" | "failed";

export type ClaimVerdict = "Supported" | "Contradicted" | "Misleading" | "Unverified";

export type AssessmentCategory = "positive" | "caution" | "negative" | "neutral";

export type DataOrigin =
  | "Live Gemini Prototype"
  | "Sample Baseline (Mock)"
  | "FastAPI Backend";

export interface ConfidenceRange {
  low: number;
  high: number;
  label: string;
}

export interface SourceReference {
  name: string;
  title: string;
  url: string;
  publishedDate: string;
  excerpt?: string;
}

export interface ManipulationIndicator {
  area: string;
  observation: string;
  severity: "low" | "moderate" | "elevated";
}

export interface VisualConsistencyFinding {
  check: string;
  finding: string;
  status: "consistent" | "inconclusive" | "anomaly";
}

export interface AiGeneratedIndicator {
  signal: string;
  observation: string;
  likelihoodNote: string;
}

export interface ImageMetadataInfo {
  fileName: string;
  fileSize: string;
  dimensions: string;
  mimeType: string;
  aspectRatio: string;
  exifStatus: string;
  lastModified?: string;
}

export interface ImageAnalysisResult {
  overallAssessment:
    | "No Strong Manipulation Signals"
    | "Mixed / Inconclusive Signals"
    | "Potential Manipulation Indicators"
    | "Potential AI-Generation Indicators";
  possibleManipulationIndicators: ManipulationIndicator[];
  metadataInfo: ImageMetadataInfo;
  visualConsistencyFindings: VisualConsistencyFinding[];
  aiGeneratedIndicators: AiGeneratedIndicator[];
  confidenceRange: ConfidenceRange;
  uncertaintySummary: string;
  explanation: string;
  limitations: string[];
}

export interface ExtractedClaim {
  id: string;
  claim: string;
  assessment: ClaimVerdict;
  rationale: string;
}

export interface NewsAnalysisResult {
  originalClaim: string;
  sourceUrl?: string;
  assessment: ClaimVerdict;
  extractedClaims: ExtractedClaim[];
  supportingEvidence: string[];
  contradictingEvidence: string[];
  sources: SourceReference[];
  analysisTimestamp: string;
  confidenceRange: ConfidenceRange;
  explanation: string;
  limitations: string[];
}

export interface DocumentClaim {
  id: string;
  claim: string;
  section: string;
  verificationNote: string;
  status: ClaimVerdict;
}

export interface DocumentComparisonFinding {
  topic: string;
  documentPosition: string;
  externalContext: string;
  alignment: "Aligned" | "Divergent" | "Requires Review";
}

export interface DocumentAnalysisResult {
  fileName: string;
  fileSize: string;
  pageCountEstimate: number;
  mimeType: string;
  extractedText: string;
  documentMetadata: {
    title: string;
    authorOrOrg: string;
    documentDate: string;
    documentType: string;
    wordCount: number;
  };
  keyClaims: DocumentClaim[];
  comparisonFindings: DocumentComparisonFinding[];
  overallAssessment: string;
  confidenceRange: ConfidenceRange;
  explanation: string;
  limitations: string[];
}

export interface EvidenceTableRow {
  factor: string;
  observation: string;
  signal: string;
  weight: string;
}

export interface ModelFindingRow {
  module: string;
  summary: string;
  uncertainty: string;
}

export interface InvestigationRecord {
  id: string;
  type: InvestigationType;
  title: string;
  submittedSummary: string;
  createdAt: string;
  status: InvestigationStatus;
  assessmentLabel: string;
  assessmentCategory: AssessmentCategory;
  confidenceLabel: string;
  dataOrigin: DataOrigin;
  previewImageUrl?: string;
  imageResult?: ImageAnalysisResult;
  newsResult?: NewsAnalysisResult;
  documentResult?: DocumentAnalysisResult;
  evidenceTable: EvidenceTableRow[];
  modelFindings: ModelFindingRow[];
  sources: SourceReference[];
  limitations: string[];
}

export interface ActivityPoint {
  date: string;
  images: number;
  news: number;
  documents: number;
  text: number;
  total: number;
}
