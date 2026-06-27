import { connectedComponents, degreeCentrality } from "./community-detection";
import { explainEdge } from "./edge-explainer";
import { getLocalGraph } from "./graph-store";
import { shortestPath } from "./shortest-path";

export function runLocalGraphQuery(params?: { source?: string; target?: string; edgeId?: string }) {
  const graph = getLocalGraph();
  return {
    mode: process.env.NEO4J_URI ? "Neo4j-ready adapter" : "local POLE graph fallback",
    graph,
    components: connectedComponents(),
    centrality: degreeCentrality().slice(0, 6),
    shortestPath: params?.source && params?.target ? shortestPath(params.source, params.target) : [],
    edgeExplanation: params?.edgeId ? explainEdge(params.edgeId) : explainEdge(graph.edges[0]?.id ?? "")
  };
}
