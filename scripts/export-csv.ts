import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getSyntheticData } from "../src/lib/synthetic-data";

const outDir = join(process.cwd(), "data", "generated");
mkdirSync(outDir, { recursive: true });

function csv<T extends object>(rows: T[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0] as Record<string, unknown>);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [
    headers.join(","),
    ...rows.map((row) => {
      const record = row as Record<string, unknown>;
      return headers.map((header) => escape(record[header])).join(",");
    })
  ].join("\n");
}

const data = getSyntheticData();

writeFileSync(join(outDir, "cases.csv"), csv(data.cases.slice(0, 50000)), "utf8");
writeFileSync(join(outDir, "persons.csv"), csv(data.people), "utf8");
writeFileSync(join(outDir, "evidence_links.csv"), csv(data.evidence), "utf8");
writeFileSync(join(outDir, "modus_operandi.csv"), csv(data.modus), "utf8");
writeFileSync(join(outDir, "alerts.csv"), csv(data.alerts), "utf8");
writeFileSync(join(outDir, "graph_nodes.csv"), csv(data.graph.nodes), "utf8");
writeFileSync(join(outDir, "graph_edges.csv"), csv(data.graph.edges.map((edge) => ({ ...edge, evidence_points: edge.evidence_points.join(" | ") }))), "utf8");

console.log(`Exported synthetic dataset to ${outDir}`);
