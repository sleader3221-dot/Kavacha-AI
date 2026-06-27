import { NextResponse } from "next/server";
import { z } from "zod";
import { answerCopilotQuery } from "@/lib/query-engine";

export const runtime = "nodejs";

const Schema = z.object({
  query: z.string().min(3).max(2000),
  role: z.enum(["scrb_admin", "sp", "sho", "analyst", "demo_judge"]).default("demo_judge")
});

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid mission brief request" }, { status: 400 });
  }

  const result = await answerCopilotQuery(parsed.data);
  return NextResponse.json({
    title: "Kavacha AI Mission Brief",
    query: parsed.data.query,
    summary: result.answer,
    hotspots: result.hotspots,
    patrolPlan: result.patrolPlan,
    generatedZcql: result.generatedZcql,
    generatedCypher: result.generatedCypher,
    confidence: result.confidence,
    audit: result.audit,
    limitations: result.limitations
  });
}
