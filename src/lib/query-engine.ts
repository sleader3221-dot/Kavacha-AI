import { addDays, format } from "date-fns";
import { executeZcqlOrFallback } from "@/lib/catalyst/zcql";
import { OFFICIAL_STATS, RESEARCH_SOURCES } from "./catalog";
import { sha256, shortHash } from "./hash";
import { getSyntheticData } from "./synthetic-data";
import type {
  AuditLog,
  CopilotResult,
  CrimeHead,
  EngineName,
  Hotspot,
  PatrolPlanItem,
  QueryValidation,
  RoleId
} from "./types";

export interface CopilotInput {
  query: string;
  role: RoleId;
  userId?: string;
}

function normalise(query: string) {
  return query.toLowerCase().trim();
}

function expandKanglish(query: string) {
  const replacements: Record<string, string> = {
    alli: "in",
    jaasti: "increase high",
    jasthi: "increase high",
    yavudu: "which",
    yavaga: "when",
    kallatana: "theft",
    "kalla tana": "theft",
    aparadha: "crime",
    thane: "police station",
    thana: "police station",
    bengaluru: "bengaluru",
    cyber: "cyber",
    plan: "plan",
    patrol: "patrol"
  };

  return Object.entries(replacements).reduce(
    (value, [source, target]) => value.replace(new RegExp(`\\b${source}\\b`, "gi"), target),
    query
  );
}

function detectLanguage(query: string): "Kannada" | "English" | "Kanglish" {
  if (/[\u0C80-\u0CFF]/.test(query)) return "Kannada";
  const text = normalise(query);
  if (/(alli|jaasti|jasthi|yavudu|kallatana|aparadha|thane|thana)\b/.test(text)) return "Kanglish";
  return "English";
}

function detectHeads(query: string): CrimeHead[] {
  const text = normalise(`${query} ${expandKanglish(query)}`);
  const heads: CrimeHead[] = [];
  if (text.includes("cyber") || text.includes("ಸೈಬರ್")) heads.push("Cyber fraud");
  if (text.includes("theft") || text.includes("ಕಳ್ಳತನ")) heads.push("Theft");
  if (text.includes("chain") || text.includes("snatching")) heads.push("Chain snatching");
  if (text.includes("ndps") || text.includes("narcotic")) heads.push("NDPS");
  if (text.includes("pocso") || text.includes("children") || text.includes("ಮಕ್ಕಳ")) heads.push("POCSO");
  if (text.includes("women") || text.includes("ಮಹಿಳ")) heads.push("Women safety");
  if (text.includes("senior") || text.includes("ಹಿರಿಯ")) heads.push("Senior citizen safety");
  return heads.length ? heads : ["Cyber fraud", "Theft"];
}

function routeEngines(query: string, heads: CrimeHead[]): EngineName[] {
  const text = normalise(`${query} ${expandKanglish(query)}`);
  const engines = new Set<EngineName>(["ZCQL aggregate"]);
  if (text.includes("where") || text.includes("area") || text.includes("ಪ್ರದೇಶ") || text.includes("hotspot")) {
    engines.add("PostGIS hotspot");
    engines.add("QuickML risk");
  }
  if (text.includes("link") || text.includes("network") || text.includes("connected") || text.includes("graph")) {
    engines.add("GraphRAG");
  }
  if (text.includes("explain") || text.includes("why") || text.includes("source")) {
    engines.add("Vector RAG");
  }
  if (text.includes("patrol") || text.includes("ಪೆಟ್ರೋಲಿಂಗ್") || text.includes("brief") || heads.length > 1) {
    engines.add("Report engine");
    engines.add("PostGIS hotspot");
    engines.add("QuickML risk");
    engines.add("GraphRAG");
  }
  return [...engines];
}

function classifyIntent(query: string, heads: CrimeHead[]) {
  const text = normalise(`${query} ${expandKanglish(query)}`);
  const intents: string[] = [];
  if (/(count|compare|trend|month|may|2026|cases)/.test(text)) intents.push("Count/trend query");
  if (/(where|area|hotspot|map|increase|ಪ್ರದೇಶ)/.test(text)) intents.push("Map/hotspot query");
  if (/(link|network|connected|graph|phone|vehicle|modus|mo)/.test(text)) intents.push("Relationship query");
  if (/(why|explain|source|confidence)/.test(text)) intents.push("Explanation query");
  if (/(patrol|plan|brief|export|pdf|ಪೆಟ್ರೋಲಿಂಗ್)/.test(text) || heads.length > 1) {
    intents.push("Action/report query");
  }
  return intents.length ? intents.join(" + ") : "Count/trend query";
}

function filterHotspots(hotspots: Hotspot[], heads: CrimeHead[], role: RoleId) {
  const filtered = hotspots.filter((hotspot) =>
    hotspot.crimeHeads.some((head) => heads.includes(head))
  );
  const scoped = role === "sho" ? filtered.slice(0, 5) : filtered;
  return (scoped.length ? scoped : hotspots).slice(0, 6);
}

function makePatrolPlan(hotspots: Hotspot[]): PatrolPlanItem[] {
  const start = new Date();
  return hotspots.slice(0, 4).map((hotspot, index) => {
    const from = addDays(start, index * 3);
    const to = addDays(from, 2);
    return {
      dayRange: `${format(from, "MMM d")} - ${format(to, "MMM d")}`,
      area: `${hotspot.station} / ${hotspot.beat}`,
      window: hotspot.patrolWindow,
      focus: hotspot.crimeHeads.join(" + "),
      rationale: `${Math.round(hotspot.riskScore * 100)} risk score, ${hotspot.trendDelta}% increase, ${Math.round(
        hotspot.confidence * 100
      )}% confidence.`
    };
  });
}

function zcqlFor(heads: CrimeHead[], role: RoleId) {
  const headsList = heads.map((head) => `'${head}'`).join(", ");
  const rolePredicate =
    role === "sho"
      ? "AND district = 'Bengaluru City' AND station IN ('Whitefield','Majestic','Koramangala','Indiranagar')"
      : "AND district = 'Bengaluru City'";
  return `SELECT station, crime_head, COUNT(case_id) AS cases, AVG(severity_weight) AS severity_index
FROM cases
WHERE report_month = '2026-05'
  ${rolePredicate}
  AND crime_head IN (${headsList})
GROUP BY station, crime_head
ORDER BY cases DESC
LIMIT 10;`;
}

function validateZcql(query: string): QueryValidation {
  const upper = query.toUpperCase();
  const blockedTerms = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "UNION", "EXEC"].filter((term) =>
    upper.includes(term)
  );
  const hasSelect = upper.trim().startsWith("SELECT");
  const allowedClauses = ["SELECT", "WHERE", "GROUP BY", "ORDER BY", "LIMIT", "JOIN"].filter((term) =>
    upper.includes(term)
  );

  if (!hasSelect || blockedTerms.length > 0) {
    return {
      status: "blocked",
      allowedClauses,
      blockedTerms,
      reason: "Only read-only SELECT-style ZCQL is allowed for copilot-generated operational queries."
    };
  }

  return {
    status: "passed",
    allowedClauses,
    blockedTerms,
    reason: "Read-only generated ZCQL passed the allow-list validator before execution."
  };
}

function cypherFor(heads: CrimeHead[]) {
  const headsList = heads.map((head) => `"${head}"`).join(", ");
  return `MATCH (c:Case)-[:HAS_MO|USES_PHONE|USES_BANK|USES_VEHICLE*1..2]-(n)
WHERE c.month = "2026-05" AND c.crime_head IN [${headsList}]
WITH c, n, count(*) AS links
RETURN c.case_id, labels(n) AS node_type, n.masked_id, links
ORDER BY links DESC
LIMIT 50;`;
}

function answerText(hotspots: Hotspot[], heads: CrimeHead[], role: RoleId) {
  const top = hotspots.slice(0, 3).map((hotspot) => hotspot.station).join(", ");
  const roleNote =
    role === "analyst"
      ? "The analyst view stays at aggregate station and beat level."
      : role === "sho"
        ? "The SHO view is scoped to station-actionable beats."
        : "The command view includes statewide context with Bengaluru drilldown.";

  return `For May 2026, the strongest Bengaluru City signals for ${heads.join(
    " + "
  )} are ${top}. KSP's May 2026 review records ${OFFICIAL_STATS.may2026Theft.toLocaleString(
    "en-IN"
  )} theft cases, ${OFFICIAL_STATS.may2026Cyber.toLocaleString(
    "en-IN"
  )} cybercrime cases, ${OFFICIAL_STATS.may2026Ndps.toLocaleString(
    "en-IN"
  )} NDPS cases, and ${OFFICIAL_STATS.may2026Pocso.toLocaleString(
    "en-IN"
  )} POCSO cases. Kavacha combines ZCQL aggregates, hotspot scoring, and GraphRAG link analysis; it recommends human-approved evening patrol concentration in the listed beats, with no individual prediction or unmasked personal data. ${roleNote}`;
}

function kannadaAnswerText(hotspots: Hotspot[]) {
  const top = hotspots.slice(0, 3).map((hotspot) => hotspot.station).join(", ");
  return `ಮೇ 2026 ವಿಶ್ಲೇಷಣೆಯಲ್ಲಿ ಹೆಚ್ಚು ಗಮನ ಕೊಡಬೇಕಾದ ಪ್ರದೇಶಗಳು: ${top}. ಈ ಉತ್ತರವು ಪ್ರಕರಣ ಎಣಿಕೆ, ಹಾಟ್‌ಸ್ಪಾಟ್ ಮಾದರಿ, ಗ್ರಾಫ್ ಲಿಂಕ್ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಆಡಿಟ್ ಟ್ರೇಲ್ ಆಧಾರಿತವಾಗಿದೆ. ಯಾವುದೇ ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲಿಂಗ್ ಇಲ್ಲ; ಮಾನವ ಅಧಿಕಾರಿ ಅನುಮೋದನೆಯೊಂದಿಗೆ ಬೀಟ್ ಮಟ್ಟದ ಕ್ರಮ ಮಾತ್ರ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.`;
}

export async function answerCopilotQuery(input: CopilotInput): Promise<CopilotResult> {
  const data = getSyntheticData();
  const language = detectLanguage(input.query);
  const heads = detectHeads(input.query);
  const engines = routeEngines(input.query, heads);
  const intent = classifyIntent(input.query, heads);
  const hotspots = filterHotspots(data.hotspots, heads, input.role);
  const patrolPlan = makePatrolPlan(hotspots);
  const generatedZcql = zcqlFor(heads, input.role);
  const generatedCypher = cypherFor(heads);
  const queryValidation = validateZcql(generatedZcql);
  const zcqlExecution = await executeZcqlOrFallback(generatedZcql);
  const confidence = Number(
    Math.min(0.96, 0.82 + hotspots.reduce((sum, item) => sum + item.confidence, 0) / hotspots.length / 10).toFixed(2)
  );
  const requestId = `KAV-${shortHash(`${input.query}-${Date.now()}`, 10)}`;
  const timestamp = new Date().toISOString();
  const answer = answerText(hotspots, heads, input.role);
  const outputHash = sha256(`${requestId}:${answer}:${generatedZcql}:${generatedCypher}`);
  const evidenceHash = sha256(`${input.query}:${answer}:${generatedZcql}:${generatedCypher}:${timestamp}`);

  const audit: AuditLog = {
    audit_id: `AUD-${shortHash(outputHash, 10)}`,
    user_id: input.userId ?? "demo.officer",
    role: input.role,
    query: input.query,
    language,
    intent,
    generated_zcql: generatedZcql,
    generated_cypher: generatedCypher,
    data_sources: ["Synthetic SCRB-style cases table", "KSP Crime Review May 2026 public aggregate", "Kavacha POLE graph"],
    model_used: "Kavacha deterministic router + hotspot scorer + GraphRAG synthesizer",
    engines,
    timestamp,
    confidence,
    output_hash: outputHash,
    evidence_hash: evidenceHash,
    officer_action: "Human approval required before patrol deployment"
  };

  return {
    requestId,
    answer,
    kannadaAnswer: kannadaAnswerText(hotspots),
    confidence,
    engines,
    hotspots,
    patrolPlan,
    graph: data.graph,
    generatedZcql,
    generatedCypher,
    queryValidation,
    zcqlExecution,
    limitations: [
      "Prototype uses deterministic synthetic case-level data generated from public aggregate patterns.",
      "Hotspot output is area/time/category intelligence and must not be used for individual profiling.",
      "Official deployment requires authorised SCRB/CCTNS feeds and approved RBAC policies."
    ],
    nextActions: [
      "Review top hotspot explanations with the station officer.",
      "Approve or dismiss patrol cards with a recorded reason.",
      "Export the mission brief and preserve the audit hash for accountability."
    ],
    citations: RESEARCH_SOURCES.slice(0, 5).map((source) => source.label),
    audit,
    metrics: {
      mayCyberCases: OFFICIAL_STATS.may2026Cyber,
      mayTheftCases: OFFICIAL_STATS.may2026Theft,
      mayNdpsCases: OFFICIAL_STATS.may2026Ndps,
      mayPocsoCases: OFFICIAL_STATS.may2026Pocso,
      casesAnalysed: data.cases.length
    }
  };
}
