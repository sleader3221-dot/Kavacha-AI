export interface RiskInput {
  recentCaseCount: number;
  trendDelta: number;
  repeatMoScore: number;
  graphLinkCount: number;
  severityWeight: number;
  dataFreshness: number;
}

export function scoreRisk(input: RiskInput) {
  const normalizedCount = Math.min(1, input.recentCaseCount / 100);
  const normalizedTrend = Math.min(1, Math.max(0, input.trendDelta) / 30);
  const normalizedLinks = Math.min(1, input.graphLinkCount / 10);
  const score =
    0.3 * normalizedCount +
    0.2 * normalizedTrend +
    0.2 * input.repeatMoScore +
    0.15 * normalizedLinks +
    0.1 * input.severityWeight +
    0.05 * input.dataFreshness;
  const riskScore = Math.round(score * 100);
  return {
    riskScore,
    riskLevel: riskScore >= 85 ? "Critical" : riskScore >= 70 ? "High" : riskScore >= 45 ? "Medium" : "Low",
    explanation: "Weighted local score from recent count, trend delta, repeat MO, graph links, severity, and freshness."
  };
}
