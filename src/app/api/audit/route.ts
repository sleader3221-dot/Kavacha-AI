import { NextResponse } from "next/server";
import { readAuditFromCatalystOrFallback } from "@/lib/catalyst/audit";

export const runtime = "nodejs";

export async function GET() {
  const audit = readAuditFromCatalystOrFallback();
  return NextResponse.json(
    {
      mode: audit.mode,
      logs: audit.logs
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
