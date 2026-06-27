import { getSyntheticData } from "@/lib/synthetic-data";

export const CATALYST_TABLES = [
  "cases",
  "persons",
  "case_person_links",
  "locations",
  "evidence_links",
  "modus_operandi",
  "alerts",
  "audit_logs",
  "roles",
  "source_register"
];

export function catalystDatastoreHealth() {
  const data = getSyntheticData();
  return {
    mode: process.env.CATALYST_PROJECT_ID ? "Catalyst Data Store" : "Synthetic fallback",
    tables: CATALYST_TABLES,
    syntheticRows: {
      cases: data.cases.length,
      persons: data.people.length,
      evidence_links: data.evidence.length,
      modus_operandi: data.modus.length,
      alerts: data.alerts.length
    },
    lastIngest: new Date().toISOString()
  };
}
