import { validateReadOnlyZcql } from "@/lib/security/query-allowlist";
import { getSyntheticData } from "@/lib/synthetic-data";
import type { ZcqlExecutionResult } from "@/lib/types";

export async function executeZcqlOrFallback(query: string): Promise<ZcqlExecutionResult> {
  const validation = validateReadOnlyZcql(query);
  if (validation.status === "blocked") {
    return {
      mode: "blocked",
      validation,
      rows: []
    };
  }

  const data = getSyntheticData();
  const rows = data.hotspots.slice(0, 10).map((hotspot) => ({
    station: hotspot.station,
    beat: hotspot.beat,
    crime_heads: hotspot.crimeHeads.join(", "),
    risk_score: hotspot.riskScore,
    confidence: hotspot.confidence,
    trend_delta: hotspot.trendDelta
  }));

  return {
    mode: process.env.CATALYST_PROJECT_ID ? "catalyst-ready" : "synthetic-fallback",
    validation,
    rows
  };
}
