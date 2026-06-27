import { getSyntheticData } from "../src/lib/synthetic-data";
import { piiMaskingReport } from "../src/lib/security/pii-redactor";

const data = getSyntheticData();
const required = {
  cases: data.cases.length >= 50000,
  people: data.people.length > 0,
  evidence: data.evidence.length > 0,
  modus: data.modus.length > 0,
  alerts: data.alerts.length > 0,
  graphEdges: data.graph.edges.every((edge) => edge.strength > 0 && edge.reason && edge.evidence_points.length > 0)
};

const failures = Object.entries(required).filter(([, ok]) => !ok);

console.log(JSON.stringify({ rows: { cases: data.cases.length }, required, pii: piiMaskingReport() }, null, 2));

if (failures.length) {
  console.error(`Dataset validation failed: ${failures.map(([name]) => name).join(", ")}`);
  process.exit(1);
}
