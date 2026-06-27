import { DEMO_QUERY_ENGLISH, DEMO_QUERY_KANNADA } from "@/lib/catalog";
import { expandKanglishTerms } from "./kanglish-dictionary";

export type DetectedLanguage = "Kannada" | "English" | "Kanglish";

export function detectInputLanguage(input: string): DetectedLanguage {
  if (/[\u0C80-\u0CFF]/.test(input)) return "Kannada";
  if (expandKanglishTerms(input) !== input) return "Kanglish";
  return "English";
}

export function normalizeOfficerQuery(input: string) {
  const language = detectInputLanguage(input);
  const canonical =
    language === "Kannada" && input.includes("ಮೇ 2026")
      ? DEMO_QUERY_ENGLISH
      : language === "Kanglish"
        ? expandKanglishTerms(input)
        : input;

  return {
    language,
    original: input,
    canonical,
    fallbackTranscription: input.trim().length > 0 ? input : DEMO_QUERY_KANNADA,
    confidence: language === "English" ? 0.96 : language === "Kannada" ? 0.9 : 0.84
  };
}
