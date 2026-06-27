import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditToCatalystOrFallback } from "@/lib/catalyst/audit";
import { answerCopilotQuery } from "@/lib/query-engine";

export const runtime = "nodejs";

const CopilotSchema = z.object({
  query: z.string().min(3).max(2000),
  role: z.enum(["scrb_admin", "sp", "sho", "analyst", "demo_judge"]),
  userId: z.string().max(80).optional()
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = CopilotSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid copilot request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await answerCopilotQuery(parsed.data);
    writeAuditToCatalystOrFallback(result.audit);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Copilot request failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
