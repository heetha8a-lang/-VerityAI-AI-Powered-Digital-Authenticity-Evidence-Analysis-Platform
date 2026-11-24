import { NextRequest, NextResponse } from "next/server";
import { getServerInvestigationById } from "@/lib/investigationStoreServer";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const item = getServerInvestigationById(id);

  if (!item) {
    return NextResponse.json(
      { error: `Report '${id}' was not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json(item);
}
