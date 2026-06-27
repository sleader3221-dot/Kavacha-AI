export function simulatePatrolCoverage(units: number, hotspotCount: number) {
  const covered = Math.min(hotspotCount, Math.max(1, units * 2));
  const coverage = Math.min(92, 48 + units * 11);
  return {
    units,
    coveredHotspots: covered,
    hotspotCount,
    coverageEstimate: coverage,
    remainingBlindZones: Math.max(0, hotspotCount - covered),
    disclaimer: "Coverage improvement estimate only; Kavacha does not claim exact crime reduction."
  };
}
