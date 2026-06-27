import { NextResponse } from "next/server";
import { catalystClientState } from "@/lib/catalyst/client";
import { catalystDatastoreHealth } from "@/lib/catalyst/datastore";
import { quickMlHealth } from "@/lib/catalyst/quickml";
import { getDashboardSnapshot } from "@/lib/synthetic-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = getDashboardSnapshot();

  return NextResponse.json({
    ok: true,
    service: "Kavacha AI",
    runtime: "nodejs",
    mode: "synthetic",
    generatedAt: snapshot.generatedAt,
    syntheticCases: snapshot.caseCount,
    realtime: "/api/realtime",
    copilot: "/api/copilot",
    audit: "/api/audit",
    catalyst: catalystClientState(),
    datastore: catalystDatastoreHealth(),
    quickml: quickMlHealth()
  });
}
