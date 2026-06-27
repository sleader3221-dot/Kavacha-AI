import { normalizeOfficerQuery } from "./kannada-normalizer";

export async function transcribeWithBhashiniOrFallback(text: string) {
  if (!process.env.BHASHINI_API_KEY) {
    return {
      provider: "browser/demo fallback",
      ...normalizeOfficerQuery(text)
    };
  }

  return {
    provider: "BHASHINI configured",
    ...normalizeOfficerQuery(text)
  };
}
