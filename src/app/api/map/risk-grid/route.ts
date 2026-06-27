import { NextResponse } from "next/server";
import { generateRiskGrid } from "@/lib/geo/generate-risk-grid";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(generateRiskGrid(), {
    headers: { "Cache-Control": "no-store" }
  });
}
