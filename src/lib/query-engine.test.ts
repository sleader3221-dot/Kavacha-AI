import { describe, expect, it } from "vitest";
import { DEMO_QUERY_KANNADA } from "./catalog";
import { answerCopilotQuery } from "./query-engine";

describe("answerCopilotQuery", () => {
  it("routes Kannada theft and cyber patrol queries through hotspot, graph, and report engines", async () => {
    const result = await answerCopilotQuery({ query: DEMO_QUERY_KANNADA, role: "scrb_admin" });

    expect(result.metrics.mayCyberCases).toBe(947);
    expect(result.metrics.mayTheftCases).toBe(1740);
    expect(result.engines).toContain("ZCQL aggregate");
    expect(result.engines).toContain("PostGIS hotspot");
    expect(result.engines).toContain("GraphRAG");
    expect(result.engines).toContain("Report engine");
    expect(result.queryValidation.status).toBe("passed");
    expect(result.zcqlExecution.mode).toMatch(/synthetic-fallback|catalyst-ready/);
    expect(result.zcqlExecution.rows.length).toBeGreaterThan(0);
    expect(result.audit.language).toBe("Kannada");
    expect(result.hotspots.length).toBeGreaterThan(2);
    expect(result.audit.output_hash).toHaveLength(64);
    expect(result.audit.evidence_hash).toHaveLength(64);
  });

  it("scopes SHO answers to a smaller set of station-actionable hotspots", async () => {
    const admin = await answerCopilotQuery({ query: "Where is theft increasing?", role: "scrb_admin" });
    const sho = await answerCopilotQuery({ query: "Where is theft increasing?", role: "sho" });

    expect(sho.hotspots.length).toBeLessThanOrEqual(admin.hotspots.length);
    expect(sho.generatedZcql).toContain("station IN");
  });

  it("recognizes Kanglish public-safety query language", async () => {
    const result = await answerCopilotQuery({
      query: "Bengaluru alli kallatana jaasti iruva thana yavudu?",
      role: "demo_judge"
    });

    expect(result.audit.language).toBe("Kanglish");
    expect(result.answer).toContain("Theft");
  });
});
