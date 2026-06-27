import { getLocalGraph } from "./graph-store";

export function explainEdge(edgeId: string) {
  const graph = getLocalGraph();
  const edge = graph.edges.find((item) => item.id === edgeId);
  if (!edge) {
    return {
      found: false,
      explanation: "No local graph edge found for this id."
    };
  }

  return {
    found: true,
    edge,
    explanation: `Linked because of ${edge.reason}. Evidence strength ${Math.round(edge.strength * 100)}%. Human review required before action.`,
    evidence: edge.evidence_points
  };
}
