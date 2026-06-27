import { getSyntheticData } from "@/lib/synthetic-data";
import type { GraphEdge, GraphNode, NetworkGraph } from "@/lib/types";

export function getLocalGraph(): NetworkGraph {
  return getSyntheticData().graph;
}

export function adjacency(graph = getLocalGraph()) {
  const map = new Map<string, Array<{ node: GraphNode; edge: GraphEdge }>>();
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

  graph.edges.forEach((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return;
    map.set(edge.source, [...(map.get(edge.source) ?? []), { node: target, edge }]);
    map.set(edge.target, [...(map.get(edge.target) ?? []), { node: source, edge }]);
  });

  return map;
}
