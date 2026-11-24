import { NextRequest, NextResponse } from "next/server";
import { listServerInvestigations } from "@/lib/investigationStoreServer";
import { InvestigationType } from "@/types/investigation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type") as InvestigationType | "all" | null;
  const q = searchParams.get("q") ?? undefined;

  const items = listServerInvestigations({
    type: typeParam ?? "all",
    q,
  });

  return NextResponse.json(items);
}
