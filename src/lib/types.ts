export type RoleId = "scrb_admin" | "sp" | "sho" | "analyst" | "demo_judge";

export type CrimeHead =
  | "Cyber fraud"
  | "Theft"
  | "Chain snatching"
  | "NDPS"
  | "POCSO"
  | "Women safety"
  | "Senior citizen safety"
  | "Robbery"
  | "Vehicle theft";

export type EngineName =
  | "ZCQL aggregate"
  | "PostGIS hotspot"
  | "GraphRAG"
  | "Vector RAG"
  | "QuickML risk"
  | "Report engine";

export interface Role {
  id: RoleId;
  label: string;
  scope: string;
  districtScope: string[];
  canExport: boolean;
  canViewSensitive: boolean;
}

export interface Station {
  id: string;
  name: string;
  district: string;
  division: string;
  beat: string;
  lat: number;
  lng: number;
  zone: string;
  risk: number;
  trend: number;
  patrolWindow: string;
  leadCategories: CrimeHead[];
}

export interface CrimeCase {
  case_id: string;
  fir_hash: string;
  date: string;
  district: string;
  station: string;
  crime_head: CrimeHead;
  section: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "registered" | "investigation" | "chargesheet" | "closed";
  location_id: string;
  beat: string;
}

export interface Person {
  person_hash: string;
  role: "accused" | "victim" | "witness" | "complainant" | "unknown";
  age_band: "18-25" | "26-35" | "36-50" | "51-65" | "65+";
  gender: "female" | "male" | "undisclosed";
  masked_zone: string;
}

export interface EvidenceLink {
  case_id: string;
  vehicle_hash?: string;
  phone_hash?: string;
  bank_hash?: string;
  upi_hash?: string;
  sim_hash?: string;
  weapon_type?: string;
  digital_artifact_hash?: string;
}

export interface ModusOperandi {
  case_id: string;
  pattern_tags: string[];
  time_window: string;
  target_type: string;
  entry_method: string;
  escape_method: string;
  repeat_pattern_score: number;
}

export interface Hotspot {
  stationId: string;
  station: string;
  district: string;
  beat: string;
  lat: number;
  lng: number;
  crimeHeads: CrimeHead[];
  riskScore: number;
  confidence: number;
  trendDelta: number;
  explanation: string;
  patrolWindow: string;
}

export interface Alert {
  alert_id: string;
  crime_head: CrimeHead;
  area: string;
  confidence: number;
  severity: "watch" | "elevated" | "urgent";
  explanation: string;
  recommended_action: string;
  updated_at: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "case" | "person" | "phone" | "vehicle" | "bank" | "mo" | "station";
  risk?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  strength: number;
  reason: string;
  last_seen: string;
  evidence_points: string[];
}

export interface NetworkGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: string;
}

export interface MOFingerprint {
  id: string;
  title: string;
  commonPattern: string;
  linkedCases: number;
  districts: string[];
  confidence: number;
  action: string;
}

export interface PatrolPlanItem {
  dayRange: string;
  area: string;
  window: string;
  focus: string;
  rationale: string;
}

export interface AuditLog {
  audit_id: string;
  user_id: string;
  role: RoleId;
  query: string;
  language: "Kannada" | "English" | "Kanglish";
  intent: string;
  generated_zcql: string;
  generated_cypher: string;
  data_sources: string[];
  model_used: string;
  engines: EngineName[];
  timestamp: string;
  confidence: number;
  output_hash: string;
  evidence_hash: string;
  officer_action: string;
}

export interface QueryValidation {
  status: "passed" | "blocked";
  allowedClauses: string[];
  blockedTerms: string[];
  reason: string;
}

export interface CopilotResult {
  requestId: string;
  answer: string;
  kannadaAnswer: string;
  confidence: number;
  engines: EngineName[];
  hotspots: Hotspot[];
  patrolPlan: PatrolPlanItem[];
  graph: NetworkGraph;
  generatedZcql: string;
  generatedCypher: string;
  queryValidation: QueryValidation;
  limitations: string[];
  nextActions: string[];
  citations: string[];
  audit: AuditLog;
  metrics: {
    mayCyberCases: number;
    mayTheftCases: number;
    mayNdpsCases: number;
    mayPocsoCases: number;
    casesAnalysed: number;
  };
}

export interface TrendPoint {
  month: string;
  cyber: number;
  theft: number;
  ndps: number;
  pocso: number;
  senior: number;
}

export interface DashboardSnapshot {
  generatedAt: string;
  caseCount: number;
  officialStats: {
    may2026Cyber: number;
    may2026Theft: number;
    may2026Ndps: number;
    may2026Pocso: number;
    cyber2024Karnataka: number;
    cyber2024Bengaluru: number;
  };
  trends: TrendPoint[];
  hotspots: Hotspot[];
  alerts: Alert[];
  graph: NetworkGraph;
  moFingerprints: MOFingerprint[];
  fairness: {
    metric: string;
    value: string;
    status: "pass" | "watch";
  }[];
}
