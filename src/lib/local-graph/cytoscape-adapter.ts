import type { NetworkGraph } from "@/lib/types";

export function toCytoscapeElements(graph: NetworkGraph) {
  return [
    ...graph.nodes.map((node) => ({ data: node })),
    ...graph.edges.map((edge) => ({ data: edge }))
  ];
}
