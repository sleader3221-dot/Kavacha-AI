import { adjacency, getLocalGraph } from "./graph-store";

export function connectedComponents() {
  const graph = getLocalGraph();
  const adj = adjacency(graph);
  const seen = new Set<string>();
  const components: string[][] = [];

  graph.nodes.forEach((node) => {
    if (seen.has(node.id)) return;
    const stack = [node.id];
    const component: string[] = [];
    seen.add(node.id);

    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;
      component.push(current);
      for (const next of adj.get(current) ?? []) {
        if (seen.has(next.node.id)) continue;
        seen.add(next.node.id);
        stack.push(next.node.id);
      }
    }

    components.push(component);
  });

  return components;
}

export function degreeCentrality() {
  const graph = getLocalGraph();
  return graph.nodes
    .map((node) => ({
      id: node.id,
      label: node.label,
      degree: graph.edges.filter((edge) => edge.source === node.id || edge.target === node.id).length
    }))
    .sort((a, b) => b.degree - a.degree);
}
