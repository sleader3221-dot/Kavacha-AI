import { DEMO_QUERY_ENGLISH } from "./catalog";
import { sha256 } from "./hash";
import type { AuditLog, RoleId } from "./types";

type StoredAuditLog = Partial<AuditLog> & {
  generated_sql?: unknown;
};

const globalForAudit = globalThis as unknown as {
  kavachaAuditLogs?: StoredAuditLog[];
};

const ROLES: RoleId[] = ["scrb_admin", "sp", "sho", "analyst", "demo_judge"];
const LANGUAGES: AuditLog["language"][] = ["Kannada", "English", "Kanglish"];

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function role(value: unknown): RoleId {
  return ROLES.includes(value as RoleId) ? (value as RoleId) : "analyst";
}

function language(value: unknown): AuditLog["language"] {
  return LANGUAGES.includes(value as AuditLog["language"]) ? (value as AuditLog["language"]) : "English";
}

function engines(value: unknown): AuditLog["engines"] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value as AuditLog["engines"];
  }
  return ["ZCQL aggregate"];
}

function sources(value: unknown): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }
  return ["Synthetic SCRB-style cases"];
}

function confidence(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0.8;
}

function normalizeAuditLog(log: StoredAuditLog, index: number): AuditLog {
  const timestamp = text(log.timestamp, new Date(Date.now() - index * 1000).toISOString());
  const query = text(log.query, "Legacy audit entry migrated after schema upgrade");
  const generated_zcql = text(
    log.generated_zcql ?? log.generated_sql,
    "SELECT audit_id, query FROM audit_logs ORDER BY timestamp DESC LIMIT 100;"
  );
  const generated_cypher = text(
    log.generated_cypher,
    "MATCH (a:AuditLog) RETURN a.audit_id, a.output_hash LIMIT 100;"
  );
  const output_hash = text(
    log.output_hash,
    sha256(`${query}:${generated_zcql}:${generated_cypher}:${timestamp}`)
  );
  const evidence_hash = text(log.evidence_hash, sha256(`evidence:${output_hash}:${timestamp}`));

  return {
    audit_id: text(log.audit_id, `AUD-${sha256(`${output_hash}:${index}`).slice(0, 10).toUpperCase()}`),
    user_id: text(log.user_id, "legacy.user"),
    role: role(log.role),
    query,
    language: language(log.language),
    intent: text(log.intent, "Legacy audit record"),
    generated_zcql,
    generated_cypher,
    data_sources: sources(log.data_sources),
    model_used: text(log.model_used, "Kavacha audit migration fallback"),
    engines: engines(log.engines),
    timestamp,
    confidence: confidence(log.confidence),
    output_hash,
    evidence_hash,
    officer_action: text(log.officer_action, "Human approval required before patrol deployment")
  };
}

function seedLogs(): AuditLog[] {
  const timestamp = new Date(Date.now() - 1000 * 60 * 17).toISOString();
  return [
    {
      audit_id: "AUD-SEED-0001",
      user_id: "demo.scrb",
      role: "scrb_admin",
      query: DEMO_QUERY_ENGLISH,
      language: "English",
      intent: "Map/hotspot query + action/report query",
      generated_zcql:
        "SELECT station, crime_head, COUNT(*) FROM cases WHERE district = 'Bengaluru City' AND month = '2026-05' GROUP BY station, crime_head ORDER BY COUNT(*) DESC LIMIT 10;",
      generated_cypher:
        "MATCH (c:Case)-[:HAS_MO|USES_PHONE|USES_BANK*1..2]-(n) WHERE c.month = '2026-05' RETURN c,n LIMIT 50;",
      data_sources: ["Synthetic SCRB-style cases", "KSP Crime Review May 2026"],
      model_used: "Kavacha local deterministic router + hotspot scorer",
      engines: ["ZCQL aggregate", "PostGIS hotspot", "GraphRAG", "QuickML risk"],
      timestamp,
      confidence: 0.91,
      output_hash: sha256(`seed-${timestamp}`),
      evidence_hash: sha256(`seed-evidence-${timestamp}`),
      officer_action: "Human approval required before patrol deployment"
    }
  ];
}

export function getAuditLogs() {
  if (!globalForAudit.kavachaAuditLogs) {
    globalForAudit.kavachaAuditLogs = seedLogs();
  }
  const rawLogs = globalForAudit.kavachaAuditLogs;
  const normalized = rawLogs.map(normalizeAuditLog);
  globalForAudit.kavachaAuditLogs = normalized;
  return normalized;
}

export function appendAuditLog(log: AuditLog) {
  const logs = getAuditLogs();
  logs.unshift(normalizeAuditLog(log, 0));
  globalForAudit.kavachaAuditLogs = logs.slice(0, 100);
  return log;
}
