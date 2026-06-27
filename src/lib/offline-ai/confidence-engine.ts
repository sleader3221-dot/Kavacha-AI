export function computeOfflineConfidence(input: {
  sourceCount: number;
  hotspotCount: number;
  graphEdges: number;
  validationPassed: boolean;
}) {
  const base = 0.72;
  const score =
    base +
    Math.min(0.08, input.sourceCount * 0.015) +
    Math.min(0.08, input.hotspotCount * 0.012) +
    Math.min(0.06, input.graphEdges * 0.004) +
    (input.validationPassed ? 0.04 : -0.22);
  return Number(Math.max(0.2, Math.min(0.96, score)).toFixed(2));
}
