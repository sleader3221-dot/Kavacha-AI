import { normalizeOfficerQuery } from "./kannada-normalizer";

export async function translateWithIndicTransOrFallback(text: string) {
  return {
    provider: process.env.INDICTRANS_ENDPOINT ? "IndicTrans2 endpoint" : "local phrase/template fallback",
    ...normalizeOfficerQuery(text)
  };
}
