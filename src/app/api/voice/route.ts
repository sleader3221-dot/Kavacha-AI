import { NextResponse } from "next/server";
import { z } from "zod";
import { transcribeWithBhashiniOrFallback } from "@/lib/language/bhashini-client";
import { translateWithIndicTransOrFallback } from "@/lib/language/indictrans-client";

export const runtime = "nodejs";

const Schema = z.object({
  text: z.string().min(1).max(2000)
});

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid voice text" }, { status: 400 });
  }

  const transcription = await transcribeWithBhashiniOrFallback(parsed.data.text);
  const translation = await translateWithIndicTransOrFallback(parsed.data.text);
  return NextResponse.json({
    inputLanguage: transcription.language,
    transcription: transcription.original,
    translation: translation.canonical,
    confidence: Math.min(transcription.confidence, translation.confidence),
    fallback: transcription.provider
  });
}
