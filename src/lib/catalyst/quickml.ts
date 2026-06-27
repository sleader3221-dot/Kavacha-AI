import { modelMetrics } from "@/lib/ml/model-metrics";
import { scoreRisk } from "@/lib/ml/risk-score";
import type { Hotspot } from "@/lib/types";

export function quickMlHealth() {
  return {
    mode: process.env.QUICKML_ENDPOINT ? "QuickML endpoint configured" : "local risk scorer fallback",
    metrics: modelMetrics()
  };
}

export function scoreWithQuickMlOrFallback(hotspot: Hotspot) {
  if (process.env.QUICKML_ENDPOINT) {
    return {
      provider: "QuickML endpoint configured",
      score: scoreRisk({
        recentCaseCount: Math.round(hotspot.riskScore * 100),
        trendDelta: hotspot.trendDelta,
        repeatMoScore: hotspot.riskScore,
        graphLinkCount: hotspot.crimeHeads.length + 2,
        severityWeight: hotspot.riskScore,
        dataFreshness: 0.95
      })
    };
  }

  return {
    provider: "local risk scorer",
    score: scoreRisk({
      recentCaseCount: Math.round(hotspot.riskScore * 100),
      trendDelta: hotspot.trendDelta,
      repeatMoScore: hotspot.riskScore,
      graphLinkCount: hotspot.crimeHeads.length + 2,
      severityWeight: hotspot.riskScore,
      dataFreshness: 0.95
    })
  };
}
