import { describe, expect, it } from "vitest";
import { validateReadOnlyZcql } from "./query-allowlist";

describe("validateReadOnlyZcql", () => {
  it("allows read-only aggregate queries", () => {
    const result = validateReadOnlyZcql(
      "SELECT station, COUNT(*) FROM cases WHERE month='2026-05' GROUP BY station ORDER BY COUNT(*) DESC LIMIT 10"
    );

    expect(result.status).toBe("passed");
    expect(result.blockedTerms).toEqual([]);
  });

  it("blocks mutation and injection terms", () => {
    const result = validateReadOnlyZcql("SELECT * FROM cases UNION DELETE FROM audit_logs");

    expect(result.status).toBe("blocked");
    expect(result.blockedTerms).toContain("DELETE");
    expect(result.blockedTerms).toContain("UNION");
  });
});
