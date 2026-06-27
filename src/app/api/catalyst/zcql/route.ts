import { NextResponse } from "next/server";
import { z } from "zod";
import { executeZcqlOrFallback } from "@/lib/catalyst/zcql";

export const runtime = "nodejs";

const Schema = z.object({
  query: z.string().min(6).max(5000)
});

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid ZCQL request" }, { status: 400 });
  }
  return NextResponse.json(await executeZcqlOrFallback(parsed.data.query), {
    headers: { "Cache-Control": "no-store" }
  });
}
