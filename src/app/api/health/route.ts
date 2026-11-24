import { NextResponse } from "next/server";
import { hasGeminiKey, VERITY_MODEL } from "@/lib/geminiServer";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    geminiConfigured: hasGeminiKey(),
    fastApiConfigured: Boolean(process.env.NEXT_PUBLIC_FASTAPI_BASE_URL),
    primaryModel: VERITY_MODEL,
  });
}
