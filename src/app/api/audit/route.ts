import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit-store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      logs: getAuditLogs()
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
