import type { CrimeHead, EngineName } from "@/lib/types";
import { normalizeOfficerQuery } from "@/lib/language/kannada-normalizer";

export interface RoutedIntent {
  language: string;
  canonicalQuery: string;
  heads: CrimeHead[];
  engines: EngineName[];
  intent: string;
  humanApprovalRequired: boolean;
}

export function routeOfflineIntent(query: string): RoutedIntent {
  const normalized = normalizeOfficerQuery(query);
  const text = normalized.canonical.toLowerCase();
  const heads: CrimeHead[] = [];
  if (/cyber|fraud|mosha/.test(text)) heads.push("Cyber fraud");
  if (/theft|kallatana|snatching/.test(text)) heads.push("Theft");
  if (/ndps|narcotic|madaka/.test(text)) heads.push("NDPS");
  if (/pocso|children|makkalu/.test(text)) heads.push("POCSO");
  if (/women|mahile/.test(text)) heads.push("Women safety");
  if (/senior|hiriyaru/.test(text)) heads.push("Senior citizen safety");

  const engines = new Set<EngineName>(["ZCQL aggregate"]);
  if (/where|area|hotspot|map|increase/.test(text)) engines.add("PostGIS hotspot");
  if (/link|graph|phone|vehicle|bank|mo|modus/.test(text)) engines.add("GraphRAG");
  if (/why|explain|source/.test(text)) engines.add("Vector RAG");
  if (/patrol|plan|brief|export|pdf/.test(text) || heads.length > 1) {
    engines.add("QuickML risk");
    engines.add("Report engine");
  }

  return {
    language: normalized.language,
    canonicalQuery: normalized.canonical,
    heads: heads.length ? heads : ["Cyber fraud", "Theft"],
    engines: [...engines],
    intent: [...engines].join(" + "),
    humanApprovalRequired: true
  };
}
