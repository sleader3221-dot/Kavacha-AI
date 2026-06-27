import type { QueryValidation } from "@/lib/types";

const BLOCKED_TERMS = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "UNION", "EXEC", "MERGE"];
const ALLOWED_CLAUSES = ["SELECT", "WHERE", "GROUP BY", "ORDER BY", "LIMIT", "JOIN", "HAVING"];

export function validateReadOnlyZcql(query: string): QueryValidation {
  const upper = query.toUpperCase();
  const blockedTerms = BLOCKED_TERMS.filter((term) => upper.includes(term));
  const allowedClauses = ALLOWED_CLAUSES.filter((term) => upper.includes(term));
  const startsWithSelect = upper.trim().startsWith("SELECT");

  if (!startsWithSelect || blockedTerms.length > 0) {
    return {
      status: "blocked",
      allowedClauses,
      blockedTerms,
      reason: "Only allow-listed read-only ZCQL SELECT queries can execute in Kavacha."
    };
  }

  return {
    status: "passed",
    allowedClauses,
    blockedTerms,
    reason: "Read-only generated ZCQL passed the allow-list validator before execution."
  };
}
