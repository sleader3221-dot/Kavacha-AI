import { NextResponse } from "next/server";
import { getDashboardSnapshot } from "@/lib/synthetic-data";

export const runtime = "nodejs";

export async function GET() {
  const snapshot = getDashboardSnapshot();

  return NextResponse.json({
    ok: true,
    service: "Kavacha AI",
    generatedAt: snapshot.generatedAt,
    syntheticCases: snapshot.caseCount,
    realtime: "/api/realtime",
    copilot: "/api/copilot",
    audit: "/api/audit"
  });
}
