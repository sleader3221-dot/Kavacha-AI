import { describe, expect, it } from "vitest";
import { connectedComponents, degreeCentrality } from "./community-detection";
import { explainEdge } from "./edge-explainer";
import { runLocalGraphQuery } from "./graph-query";
import { shortestPath } from "./shortest-path";

describe("local graph service", () => {
  it("returns graph intelligence with evidence explanations", () => {
    const result = runLocalGraphQuery({ edgeId: "e1", source: "case-cy-1042", target: "phone-44c1" });

    expect(result.mode).toContain("local");
    expect(result.graph.edges.length).toBeGreaterThan(0);
    expect(result.edgeExplanation.found).toBe(true);
    expect(result.shortestPath).toEqual(["case-cy-1042", "phone-44c1"]);
  });

  it("computes connected components and degree centrality", () => {
    expect(connectedComponents().length).toBeGreaterThan(0);
    expect(degreeCentrality()[0].degree).toBeGreaterThan(1);
    expect(explainEdge("e1").evidence?.length).toBeGreaterThan(0);
  });
});
