import { describe, expect, it } from "vitest";
import { generateRiskGrid } from "./geo/generate-risk-grid";
import { generateSyntheticCasePoints } from "./geo/generate-case-points";
import { getSyntheticData } from "./synthetic-data";

describe("synthetic dataset quality", () => {
  it("contains 50K+ cases and explainable graph edges", () => {
    const data = getSyntheticData();

    expect(data.cases.length).toBeGreaterThanOrEqual(50000);
    expect(data.graph.edges.every((edge) => edge.strength > 0 && edge.evidence_points.length > 0)).toBe(true);
  });

  it("generates map-ready GeoJSON layers", () => {
    expect(generateSyntheticCasePoints(10).features).toHaveLength(10);
    expect(generateRiskGrid().features.length).toBeGreaterThan(5);
  });
});
