import { NextResponse } from "next/server";
import { z } from "zod";
import { runLocalGraphQuery } from "@/lib/local-graph/graph-query";

export const runtime = "nodejs";

const Schema = z.object({
  source: z.string().optional(),
  target: z.string().optional(),
  edgeId: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid graph query" }, { status: 400 });
  }
  return NextResponse.json(runLocalGraphQuery(parsed.data), {
    headers: { "Cache-Control": "no-store" }
  });
}

export async function GET() {
  return NextResponse.json(runLocalGraphQuery(), {
    headers: { "Cache-Control": "no-store" }
  });
}
