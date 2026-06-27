import { adjacency, getLocalGraph } from "./graph-store";

export function shortestPath(source: string, target: string) {
  const graph = getLocalGraph();
  const adj = adjacency(graph);
  const queue: Array<{ id: string; path: string[] }> = [{ id: source, path: [source] }];
  const seen = new Set<string>([source]);

  while (queue.length) {
    const current = queue.shift();
    if (!current) break;
    if (current.id === target) return current.path;
    for (const next of adj.get(current.id) ?? []) {
      if (seen.has(next.node.id)) continue;
      seen.add(next.node.id);
      queue.push({ id: next.node.id, path: [...current.path, next.node.id] });
    }
  }

  return [];
}
