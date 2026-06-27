import { describe, expect, it } from "vitest";
import { getSyntheticData } from "@/lib/synthetic-data";
import { detectAnomalies } from "./anomaly-detector";
import { scoreRisk } from "./risk-score";
import { simulatePatrolCoverage } from "./what-if-simulator";

describe("local ML services", () => {
  it("scores area/time/category risk without person prediction", () => {
    const score = scoreRisk({
      recentCaseCount: 86,
      trendDelta: 18,
      repeatMoScore: 0.88,
      graphLinkCount: 5,
      severityWeight: 0.81,
      dataFreshness: 0.95
    });

    expect(score.riskScore).toBeGreaterThan(60);
    expect(score.explanation).toContain("Weighted local score");
  });

  it("detects hotspot anomalies and simulates coverage", () => {
    const data = getSyntheticData();
    expect(detectAnomalies(data.hotspots).length).toBeGreaterThan(0);
    expect(simulatePatrolCoverage(3, 10).remainingBlindZones).toBe(4);
  });
});
