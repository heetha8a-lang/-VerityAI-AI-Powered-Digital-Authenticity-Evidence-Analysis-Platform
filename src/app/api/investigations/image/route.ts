import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import {
  executeWithModelFallback,
  GeminiRouteError,
  getGeminiClient,
  hasGeminiKey,
} from "@/lib/geminiServer";
import { tryExtractJsonObject } from "@/lib/groundingParser";
import { saveServerInvestigation } from "@/lib/investigationStoreServer";
import { buildMockImageInvestigation } from "@/lib/mockAnalyzer";
import { generateInvestigationId } from "@/lib/utils";
import {
  AssessmentCategory,
  ImageAnalysisResult,
  InvestigationRecord,
} from "@/types/investigation";

interface ImageRequestBody {
  imageBase64?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: string;
  dimensions?: string;
  aspectRatio?: string;
  exifStatus?: string;
  lastModified?: string;
  userContext?: string;
  mode?: "live" | "mock";
}

function mapCategory(
  assessment: ImageAnalysisResult["overallAssessment"]
): AssessmentCategory {
  if (assessment === "No Strong Manipulation Signals") return "positive";
  if (assessment === "Mixed / Inconclusive Signals") return "neutral";
  return "caution";
}

export async function POST(req: NextRequest) {
  let body: ImageRequestBody;
  try {
    body = (await req.json()) as ImageRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  try {
    if (!body.imageBase64 || !body.mimeType) {
      return NextResponse.json(
        { error: "Image payload (base64 and mimeType) is required." },
        { status: 400 }
      );
    }

    if (body.mode === "mock" || !hasGeminiKey()) {
      const mockRecord = buildMockImageInvestigation({
        fileName: body.fileName ?? "uploaded-image",
        fileSize: body.fileSize ?? "Unknown",
        dimensions: body.dimensions ?? "Unknown",
        mimeType: body.mimeType,
        aspectRatio: body.aspectRatio ?? "Unknown",
        exifStatus: body.exifStatus ?? "Not inspected",
        lastModified: body.lastModified,
        userContext: body.userContext,
      });
      saveServerInvestigation(mockRecord);
      return NextResponse.json(mockRecord);
    }

    const cleanBase64 = body.imageBase64.includes(",")
      ? body.imageBase64.split(",")[1]
      : body.imageBase64;

    const ai = getGeminiClient();

    const promptText = `Analyze the attached image from a digital media forensics and visual authenticity perspective.
Metadata supplied by the client container:
- File name: ${body.fileName ?? "uploaded-image"}
- File size: ${body.fileSize ?? "Unknown"}
- Dimensions: ${body.dimensions ?? "Unknown"}
- Aspect ratio: ${body.aspectRatio ?? "Unknown"}
- EXIF status: ${body.exifStatus ?? "Not inspected"}
- User context: ${body.userContext?.trim() || "None provided"}

CRITICAL EPISTEMIC RULES:
1. Never state or imply that the image is "100% real" or "definitely fake" based on visual inspection alone.
2. Describe concrete observable visual evidence: lighting & shadow direction, specular reflections, perspective geometry, edge/compression consistency, text/signage legibility, anatomical or structural coherence, and potential AI-generation cues.
3. Explicitly note uncertainty and forensic limitations (e.g., stripped EXIF, recompression, absence of C2PA Content Credentials).
4. Choose overallAssessment strictly from: "No Strong Manipulation Signals", "Mixed / Inconclusive Signals", "Potential Manipulation Indicators", or "Potential AI-Generation Indicators".`;

    const { result: response, modelUsed } = await executeWithModelFallback((model) =>
      ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: body.mimeType!,
                data: cleanBase64,
              },
            },
            { text: promptText },
          ],
        },
        config: {
          systemInstruction:
            "You are a careful digital media forensics analyst for VerityAI. Produce structured, objective, calibrated assessments without overclaiming certainty.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallAssessment: {
                type: Type.STRING,
                enum: [
                  "No Strong Manipulation Signals",
                  "Mixed / Inconclusive Signals",
                  "Potential Manipulation Indicators",
                  "Potential AI-Generation Indicators",
                ],
              },
              title: { type: Type.STRING },
              submittedSummary: { type: Type.STRING },
              possibleManipulationIndicators: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    area: { type: Type.STRING },
                    observation: { type: Type.STRING },
                    severity: {
                      type: Type.STRING,
                      enum: ["low", "moderate", "elevated"],
                    },
                  },
                  required: ["area", "observation", "severity"],
                },
              },
              visualConsistencyFindings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    check: { type: Type.STRING },
                    finding: { type: Type.STRING },
                    status: {
                      type: Type.STRING,
                      enum: ["consistent", "inconclusive", "anomaly"],
                    },
                  },
                  required: ["check", "finding", "status"],
                },
              },
              aiGeneratedIndicators: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    signal: { type: Type.STRING },
                    observation: { type: Type.STRING },
                    likelihoodNote: { type: Type.STRING },
                  },
                  required: ["signal", "observation", "likelihoodNote"],
                },
              },
              confidenceLow: { type: Type.INTEGER },
              confidenceHigh: { type: Type.INTEGER },
              uncertaintySummary: { type: Type.STRING },
              explanation: { type: Type.STRING },
              limitations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "overallAssessment",
              "title",
              "submittedSummary",
              "possibleManipulationIndicators",
              "visualConsistencyFindings",
              "aiGeneratedIndicators",
              "confidenceLow",
              "confidenceHigh",
              "uncertaintySummary",
              "explanation",
              "limitations",
            ],
          },
        },
      })
    );

    const parsed = tryExtractJsonObject<{
      overallAssessment: ImageAnalysisResult["overallAssessment"];
      title: string;
      submittedSummary: string;
      possibleManipulationIndicators: ImageAnalysisResult["possibleManipulationIndicators"];
      visualConsistencyFindings: ImageAnalysisResult["visualConsistencyFindings"];
      aiGeneratedIndicators: ImageAnalysisResult["aiGeneratedIndicators"];
      confidenceLow: number;
      confidenceHigh: number;
      uncertaintySummary: string;
      explanation: string;
      limitations: string[];
    }>(response.text);

    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "The vision model returned an unstructured response. Please retry or review image format.",
        },
        { status: 502 }
      );
    }

    const low = Math.max(25, Math.min(90, Math.round(parsed.confidenceLow)));
    const high = Math.max(low + 5, Math.min(95, Math.round(parsed.confidenceHigh)));

    const imageResult: ImageAnalysisResult = {
      overallAssessment: parsed.overallAssessment,
      possibleManipulationIndicators: parsed.possibleManipulationIndicators ?? [],
      metadataInfo: {
        fileName: body.fileName ?? "uploaded-image",
        fileSize: body.fileSize ?? "Unknown",
        dimensions: body.dimensions ?? "Unknown",
        mimeType: body.mimeType,
        aspectRatio: body.aspectRatio ?? "Unknown",
        exifStatus: body.exifStatus ?? "Not available",
        lastModified: body.lastModified,
      },
      visualConsistencyFindings: parsed.visualConsistencyFindings ?? [],
      aiGeneratedIndicators: parsed.aiGeneratedIndicators ?? [],
      confidenceRange: {
        low,
        high,
        label: `${low}%–${high}% calibrated estimate`,
      },
      uncertaintySummary: parsed.uncertaintySummary,
      explanation: parsed.explanation,
      limitations: parsed.limitations ?? [],
    };

    const id = generateInvestigationId("VR");
    const record: InvestigationRecord = {
      id,
      type: "image",
      title: parsed.title || body.fileName || "Submitted Image Analysis",
      submittedSummary: parsed.submittedSummary,
      createdAt: new Date().toISOString(),
      status: "completed",
      assessmentLabel: parsed.overallAssessment,
      assessmentCategory: mapCategory(parsed.overallAssessment),
      confidenceLabel: imageResult.confidenceRange.label,
      dataOrigin: "Live Gemini Prototype",
      imageResult,
      evidenceTable: [
        ...imageResult.visualConsistencyFindings.map((v) => ({
          factor: v.check,
          observation: v.finding,
          signal:
            v.status === "consistent"
              ? "Consistent"
              : v.status === "anomaly"
              ? "Anomaly"
              : "Inconclusive",
          weight: "Primary",
        })),
        ...imageResult.possibleManipulationIndicators.map((m) => ({
          factor: m.area,
          observation: m.observation,
          signal: `Severity: ${m.severity}`,
          weight: "Secondary",
        })),
      ],
      modelFindings: [
        {
          module: `Gemini Multimodal Visual Inspector (${modelUsed})`,
          summary: parsed.explanation,
          uncertainty: parsed.uncertaintySummary,
        },
      ],
      sources: [],
      limitations: imageResult.limitations,
    };

    saveServerInvestigation(record);
    return NextResponse.json(record);
  } catch (err) {
    if (err instanceof GeminiRouteError) {
      return NextResponse.json(
        { error: err.message, code: err.code, isQuotaOrAuth: err.isQuotaOrAuth },
        { status: err.status }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to analyze image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
