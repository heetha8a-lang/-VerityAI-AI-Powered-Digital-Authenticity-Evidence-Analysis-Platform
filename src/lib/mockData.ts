import { ActivityPoint, InvestigationRecord } from "@/types/investigation";

/**
 * Clearly labelled sample baseline dataset used for initial dashboard visualization
 * and offline/prototype inspection before a Python FastAPI ML backend is attached.
 */
export const SAMPLE_INVESTIGATIONS: InvestigationRecord[] = [
  {
    id: "VR-2026-0142",
    type: "image",
    title: "Zurich Twilight Intersection Photograph",
    submittedSummary:
      "Street-level documentary frame submitted for lighting geometry, compression artifact, and generative-texture screening.",
    createdAt: "2026-11-22T18:40:00.000Z",
    status: "completed",
    assessmentLabel: "No Strong Manipulation Signals",
    assessmentCategory: "positive",
    confidenceLabel: "68%–82% calibrated estimate",
    dataOrigin: "Sample Baseline (Mock)",
    previewImageUrl: "/images/sample_urban_street.jpg",
    imageResult: {
      overallAssessment: "No Strong Manipulation Signals",
      possibleManipulationIndicators: [
        {
          area: "Wet Asphalt Specular Reflections",
          observation:
            "Tram headlamp reflections align geometrically with light source angles across cobblestone grooves.",
          severity: "low",
        },
        {
          area: "Storefront Typography Edges",
          observation:
            "Subtle JPEG recompression ringing around high-contrast illuminated window signage, consistent with standard web export.",
          severity: "low",
        },
      ],
      metadataInfo: {
        fileName: "sample_urban_street.jpg",
        fileSize: "1.0 MB",
        dimensions: "1200 × 900 px",
        mimeType: "image/jpeg",
        aspectRatio: "4:3",
        exifStatus: "Stripped during web upload (common across social platforms; non-diagnostic)",
      },
      visualConsistencyFindings: [
        {
          check: "Shadow & Illumination Direction",
          finding:
            "Overhead streetlamps and interior pharmacy lighting produce coherent directional falloff across pedestrians and tram surfaces.",
          status: "consistent",
        },
        {
          check: "Perspective & Vanishing Lines",
          finding:
            "Overhead catenary wires and building cornices converge consistently toward shared horizon vanishing points.",
          status: "consistent",
        },
        {
          check: "Noise Floor Uniformity",
          finding:
            "Luminance grain remains uniform across sky gradient and foreground shadows without isolated smooth patches.",
          status: "consistent",
        },
      ],
      aiGeneratedIndicators: [
        {
          signal: "Micro-Texture & Signage Coherence",
          observation:
            "Shopfront lettering and architectural masonry preserve coherent structural continuity.",
          likelihoodNote: "Low generative distortion observed in visible focal regions.",
        },
        {
          signal: "Semantic Anatomy & Motion",
          observation:
            "Pedestrian stride silhouettes and umbrella ribs appear structurally plausible under low-light exposure.",
          likelihoodNote: "No obvious diffusion-style anatomical artifacts detected.",
        },
      ],
      confidenceRange: {
        low: 68,
        high: 82,
        label: "68%–82% (Sample Baseline)",
      },
      uncertaintySummary:
        "No single visual detector can conclusively certify authenticity; missing camera EXIF limits provenance verification.",
      explanation:
        "Sample baseline inspection indicates coherent perspective geometry, consistent wet-surface reflections, and natural low-light noise distribution. Because web-exported JPEG files frequently strip camera EXIF headers, visual consistency alone cannot serve as cryptographic provenance.",
      limitations: [
        "Sample baseline record representing placeholder FastAPI CV pipeline output.",
        "Original RAW capture and C2PA Content Credentials are not present in this file.",
        "High-quality AI models or subtle color grading cannot be ruled out by visual inspection alone.",
      ],
    },
    evidenceTable: [
      {
        factor: "Lighting & Specular Geometry",
        observation: "Coherent wet pavement reflection alignment with tram lamps",
        signal: "Consistent",
        weight: "Primary",
      },
      {
        factor: "EXIF / C2PA Provenance",
        observation: "Camera metadata stripped in export container",
        signal: "Inconclusive",
        weight: "Contextual",
      },
      {
        factor: "Edge Recompression Artifacts",
        observation: "Uniform 8×8 block DCT quantization across frame",
        signal: "Nominal",
        weight: "Secondary",
      },
    ],
    modelFindings: [
      {
        module: "Visual Geometry & Shadow Analyzer (Sample)",
        summary: "Directional lighting vectors and vanishing lines align across 4 sampled depth planes.",
        uncertainty: "±14% variance under heavy rain/twilight conditions",
      },
      {
        module: "Compression & Noise Forensics (Sample)",
        summary: "No localized splice boundaries detected in luminance residual map.",
        uncertainty: "Re-encoding masks subtle prior edits",
      },
    ],
    sources: [],
    limitations: [
      "Sample baseline record — connect FastAPI CV backend or submit a live image to execute real-time analysis.",
    ],
  },
  {
    id: "VR-2026-0139",
    type: "news",
    title: "Solar Capacity Grid Share Claim Check",
    submittedSummary:
      "Claim check regarding global renewable electricity additions exceeding 80% of net new power capacity in recent annual reporting.",
    createdAt: "2026-11-21T14:15:00.000Z",
    status: "completed",
    assessmentLabel: "Supported",
    assessmentCategory: "positive",
    confidenceLabel: "74%–88% calibrated estimate",
    dataOrigin: "Sample Baseline (Mock)",
    newsResult: {
      originalClaim:
        "Renewable energy accounted for over 80% of all net new global electricity capacity additions in recent annual energy agency reporting.",
      sourceUrl: "https://www.irena.org/",
      assessment: "Supported",
      extractedClaims: [
        {
          id: "CLM-1",
          claim: "Renewables represented >80% of net new global power capacity additions.",
          assessment: "Supported",
          rationale:
            "Sample baseline aligns with published International Renewable Energy Agency (IRENA) annual capacity statistics.",
        },
        {
          id: "CLM-2",
          claim: "Solar PV drove the largest share of those new renewable installations.",
          assessment: "Supported",
          rationale:
            "Solar PV consistently accounts for roughly three-quarters of annual renewable capacity additions in recent reporting.",
        },
      ],
      supportingEvidence: [
        "IRENA Renewable Capacity Statistics document that renewables comprised well over 80% of net global capacity expansion.",
        "IEA Renewables market analyses corroborate record solar PV deployment outpacing fossil additions.",
      ],
      contradictingEvidence: [
        "Net capacity additions measure nameplate gigawatts rather than total electricity generated (TWh), where capacity factors differ.",
      ],
      sources: [
        {
          name: "IRENA (Sample Reference)",
          title: "Renewable Capacity Statistics — Global Overview",
          url: "https://www.irena.org/",
          publishedDate: "2025-03-26",
          excerpt: "Sample baseline reference illustrating structured citation display.",
        },
        {
          name: "IEA (Sample Reference)",
          title: "Renewables Annual Market Report",
          url: "https://www.iea.org/",
          publishedDate: "2025-01-15",
          excerpt: "Sample baseline reference illustrating cross-source corroboration.",
        },
      ],
      analysisTimestamp: "2026-11-21T14:15:00.000Z",
      confidenceRange: {
        low: 74,
        high: 88,
        label: "74%–88% (Sample Baseline)",
      },
      explanation:
        "This sample baseline record demonstrates how VerityAI separates nameplate capacity share from actual generation share, preventing readers from conflating installed gigawatts with total grid electricity output.",
      limitations: [
        "Sample baseline record — submit a live URL or claim in News Intelligence to run real grounded retrieval.",
        "Capacity share figures vary slightly across reporting methodologies (gross vs. net retirements).",
      ],
    },
    evidenceTable: [
      {
        factor: "Primary Statistical Reporting",
        observation: "IRENA annual capacity tables confirm >80% share of net additions",
        signal: "Supported",
        weight: "Primary",
      },
      {
        factor: "Metric Framing Nuance",
        observation: "Nameplate GW capacity differs from annual TWh generation share",
        signal: "Context Note",
        weight: "Secondary",
      },
    ],
    modelFindings: [
      {
        module: "Claim Decomposition Engine (Sample)",
        summary: "Extracted 2 atomic quantitative claims for cross-source verification.",
        uncertainty: "Subject to reporting year scope",
      },
    ],
    sources: [
      {
        name: "IRENA (Sample Reference)",
        title: "Renewable Capacity Statistics — Global Overview",
        url: "https://www.irena.org/",
        publishedDate: "2025-03-26",
      },
      {
        name: "IEA (Sample Reference)",
        title: "Renewables Annual Market Report",
        url: "https://www.iea.org/",
        publishedDate: "2025-01-15",
      },
    ],
    limitations: [
      "Sample baseline record — submit a live claim for real-time evidence retrieval.",
    ],
  },
  {
    id: "VR-2026-0135",
    type: "document",
    title: "Municipal Transit Electrification Brief.pdf",
    submittedSummary:
      "12-page policy memo analyzed for internal citation consistency, cost-per-mile assumptions, and lifecycle emissions claims.",
    createdAt: "2026-11-20T09:20:00.000Z",
    status: "completed",
    assessmentLabel: "Misleading",
    assessmentCategory: "caution",
    confidenceLabel: "62%–76% calibrated estimate",
    dataOrigin: "Sample Baseline (Mock)",
    documentResult: {
      fileName: "Municipal_Transit_Electrification_Brief.pdf",
      fileSize: "2.4 MB",
      pageCountEstimate: 12,
      mimeType: "application/pdf",
      extractedText:
        "[Sample Extracted Text Excerpt]\nSection 2.1 Fleet Operating Projections: Transitioning 140 diesel transit buses to battery-electric units is projected to reduce depot fuel expenditures by 64% within Year 1...\nSection 4.3 Grid Infrastructure: Peak charging load assumptions omit transformer upgrade capital costs budgeted under the separate Municipal Utility Capital Fund.",
      documentMetadata: {
        title: "Municipal Transit Fleet Electrification Feasibility Brief",
        authorOrOrg: "Metro Planning Working Group (Sample)",
        documentDate: "2026-10-14",
        documentType: "Policy Feasibility Memo",
        wordCount: 4180,
      },
      keyClaims: [
        {
          id: "DOC-1",
          claim: "Depot energy expenditures drop 64% in Year 1 after fleet conversion.",
          section: "Section 2.1",
          verificationNote:
            "Fuel-only comparison is plausible under off-peak tariffs, but excludes demand-charge peaks.",
          status: "Misleading",
        },
        {
          id: "DOC-2",
          claim: "Charging substation upgrades are zero-cost to the transit operating budget.",
          section: "Section 4.3",
          verificationNote:
            "Costs are shifted to a separate municipal utility capital ledger rather than eliminated.",
          status: "Misleading",
        },
      ],
      comparisonFindings: [
        {
          topic: "Total Cost of Ownership Scope",
          documentPosition: "Evaluates vehicle lease and fuel delta only",
          externalContext: "Standard transit TCO benchmarks include depot switchgear and utility interconnect fees",
          alignment: "Divergent",
        },
        {
          topic: "Tailpipe Emissions Reduction",
          documentPosition: "Reports 100% reduction in localized bus route NOx and PM2.5",
          externalContext: "Consistent with zero-tailpipe-emission electric drivetrain characteristics",
          alignment: "Aligned",
        },
      ],
      overallAssessment:
        "Sample document highlights accurate localized emissions benefits, while headline Year-1 savings omit utility capital transfers and peak demand charges.",
      confidenceRange: {
        low: 62,
        high: 76,
        label: "62%–76% (Sample Baseline)",
      },
      explanation:
        "Document comparison cross-referenced Section 2 financial assumptions against Section 4 footnotes, surfacing accounting scope omissions.",
      limitations: [
        "Sample baseline record representing placeholder OCR + document reasoning output.",
        "Municipal tariff schedules vary significantly by utility rate class.",
      ],
    },
    evidenceTable: [
      {
        factor: "Internal Section Cross-Check",
        observation: "Section 4.3 shifts capital costs omitted from Section 2.1 ROI headline",
        signal: "Misleading Framing",
        weight: "Primary",
      },
      {
        factor: "Tailpipe Emissions Claim",
        observation: "Consistent with battery-electric powertrain profiles",
        signal: "Aligned",
        weight: "Secondary",
      },
    ],
    modelFindings: [
      {
        module: "Document Claim & Cross-Reference Engine (Sample)",
        summary: "Detected scope mismatch between executive summary savings and infrastructure footnotes.",
        uncertainty: "Tariff rates depend on regional utility schedule",
      },
    ],
    sources: [],
    limitations: [
      "Sample baseline record — upload a PDF in Document Intelligence for live inspection.",
    ],
  },
  {
    id: "VR-2026-0131",
    type: "text",
    title: "Viral Battery Breakthrough Social Post",
    submittedSummary:
      "Text claim asserting a commercial smartphone battery lasting 30 days on a 2-minute charge is shipping globally this quarter.",
    createdAt: "2026-11-18T16:05:00.000Z",
    status: "completed",
    assessmentLabel: "Contradicted",
    assessmentCategory: "negative",
    confidenceLabel: "78%–91% calibrated estimate",
    dataOrigin: "Sample Baseline (Mock)",
    newsResult: {
      originalClaim:
        "A commercial smartphone with a solid-state battery offering 30-day battery life and a full 2-minute charge is shipping globally this quarter.",
      assessment: "Contradicted",
      extractedClaims: [
        {
          id: "CLM-1",
          claim: "30-day active smartphone autonomy from a 2-minute charge is commercially shipping this quarter.",
          assessment: "Contradicted",
          rationale:
            "Exceeds current commercial lithium-ion and prototype solid-state energy density and thermal charging limits.",
        },
      ],
      supportingEvidence: [],
      contradictingEvidence: [
        "No major handset manufacturer or regulatory certification filing (FCC/CE) lists a 30-day smartphone battery product.",
        "Thermal dissipation physics for charging a 5,000+ mAh cell in 120 seconds exceeds standard USB-PD consumer limits.",
      ],
      sources: [],
      analysisTimestamp: "2026-11-18T16:05:00.000Z",
      confidenceRange: {
        low: 78,
        high: 91,
        label: "78%–91% (Sample Baseline)",
      },
      explanation:
        "This sample baseline record illustrates a physically implausible consumer hardware claim lacking regulatory filings or manufacturer announcements.",
      limitations: [
        "Sample baseline record — submit live claims to run real web verification.",
      ],
    },
    evidenceTable: [
      {
        factor: "Regulatory & OEM Filings",
        observation: "No matching FCC/CE or OEM product disclosures exist",
        signal: "Contradicted",
        weight: "Primary",
      },
      {
        factor: "Energy Density & Thermal Bounds",
        observation: "2-minute full charge implies extreme C-rate thermal load",
        signal: "Implausible",
        weight: "Primary",
      },
    ],
    modelFindings: [
      {
        module: "Claim Feasibility & Corroboration Checker (Sample)",
        summary: "Claims conflict with commercial power-delivery and certification records.",
        uncertainty: "Lab prototypes may exist at coin-cell scale without commercial shipping",
      },
    ],
    sources: [],
    limitations: [
      "Sample baseline record — submit live claims in News Intelligence for grounded verification.",
    ],
  },
  {
    id: "VR-2026-0128",
    type: "image",
    title: "Nordic Research Library Atrium",
    submittedSummary:
      "Architectural daylight photograph submitted for shadow alignment and structural surface inspection.",
    createdAt: "2026-11-16T11:30:00.000Z",
    status: "completed",
    assessmentLabel: "Mixed / Inconclusive Signals",
    assessmentCategory: "neutral",
    confidenceLabel: "52%–68% calibrated estimate",
    dataOrigin: "Sample Baseline (Mock)",
    previewImageUrl: "/images/sample_architectural_atrium.jpg",
    imageResult: {
      overallAssessment: "Mixed / Inconclusive Signals",
      possibleManipulationIndicators: [
        {
          area: "Mid-staircase Motion Blur",
          observation:
            "Pedestrian silhouettes on upper stairwell show directional blur consistent with indoor shutter speed.",
          severity: "low",
        },
      ],
      metadataInfo: {
        fileName: "sample_architectural_atrium.jpg",
        fileSize: "911 KB",
        dimensions: "1200 × 900 px",
        mimeType: "image/jpeg",
        aspectRatio: "4:3",
        exifStatus: "No camera serial or lens profile embedded",
      },
      visualConsistencyFindings: [
        {
          check: "Curtain Wall Mullion Shadows",
          finding:
            "Diagonal shadow lattice cast across travertine steps aligns with window frame spacing.",
          status: "consistent",
        },
        {
          check: "Bookshelf Fine Detail",
          finding:
            "Distant shelf spines exhibit minor resolution softness making text verification inconclusive.",
          status: "inconclusive",
        },
      ],
      aiGeneratedIndicators: [
        {
          signal: "Repeating Structural Grids",
          observation:
            "Skylight trusses and wood louver spacing remain regular across perspective recession.",
          likelihoodNote: "No definitive synthetic artifacts, though high-resolution synthetic renders can mimic symmetry.",
        },
      ],
      confidenceRange: {
        low: 52,
        high: 68,
        label: "52%–68% (Sample Baseline)",
      },
      uncertaintySummary:
        "Inconclusive without original camera raw file or corroborating architectural location provenance.",
      explanation:
        "Demonstrates honest uncertainty reporting when visual geometry looks coherent yet metadata provenance is absent.",
      limitations: [
        "Sample baseline record.",
        "Visual plausibility alone cannot distinguish pristine architectural photography from modern diffusion renders without provenance.",
      ],
    },
    evidenceTable: [
      {
        factor: "Geometric Shadow Projection",
        observation: "Mullion lattice shadows track window grid",
        signal: "Consistent",
        weight: "Primary",
      },
      {
        factor: "Distant Micro-Detail",
        observation: "Low resolution on background book spines prevents text verification",
        signal: "Inconclusive",
        weight: "Secondary",
      },
    ],
    modelFindings: [
      {
        module: "Structural Symmetry & Shadow Analyzer (Sample)",
        summary: "Coherent perspective geometry; provenance remains unverified.",
        uncertainty: "Moderate ambiguity without EXIF/C2PA",
      },
    ],
    sources: [],
    limitations: ["Sample baseline record."],
  },
];

export const SAMPLE_ACTIVITY_DATA: ActivityPoint[] = [
  { date: "Nov 10", images: 2, news: 3, documents: 1, text: 2, total: 8 },
  { date: "Nov 12", images: 4, news: 2, documents: 2, text: 1, total: 9 },
  { date: "Nov 14", images: 3, news: 5, documents: 1, text: 3, total: 12 },
  { date: "Nov 16", images: 5, news: 4, documents: 3, text: 2, total: 14 },
  { date: "Nov 18", images: 3, news: 6, documents: 2, text: 4, total: 15 },
  { date: "Nov 20", images: 6, news: 4, documents: 4, text: 3, total: 17 },
  { date: "Nov 22", images: 4, news: 5, documents: 2, text: 3, total: 14 },
];
