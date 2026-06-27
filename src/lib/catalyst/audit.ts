import { appendAuditLog, getAuditLogs } from "@/lib/audit-store";
import type { AuditLog } from "@/lib/types";

export function writeAuditToCatalystOrFallback(log: AuditLog) {
  return {
    mode: process.env.CATALYST_PROJECT_ID ? "Catalyst Data Store adapter" : "in-memory fallback",
    log: appendAuditLog(log)
  };
}

export function readAuditFromCatalystOrFallback() {
  return {
    mode: process.env.CATALYST_PROJECT_ID ? "Catalyst Data Store adapter" : "in-memory fallback",
    logs: getAuditLogs()
  };
}
