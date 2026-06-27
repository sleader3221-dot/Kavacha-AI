import { NextResponse } from "next/server";
import { patrolRouteGeoJson } from "@/lib/geo/patrol-route-planner";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(patrolRouteGeoJson(), {
    headers: { "Cache-Control": "no-store" }
  });
}
