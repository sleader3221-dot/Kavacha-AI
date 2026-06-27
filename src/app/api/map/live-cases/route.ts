import { NextResponse } from "next/server";
import { generateSyntheticCasePoints } from "@/lib/geo/generate-case-points";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(generateSyntheticCasePoints(50), {
    headers: { "Cache-Control": "no-store" }
  });
}
