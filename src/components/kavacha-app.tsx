"use client";

import cytoscape from "cytoscape";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  FileText,
  Fingerprint,
  Gauge,
  GitBranch,
  Languages,
  ListChecks,
  Loader2,
  LockKeyhole,
  MapPinned,
  Mic,
  Network,
  QrCode,
  Radio,
  RefreshCcw,
  Route,
  Search,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserCheck,
  Volume2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  APP_NAME,
  APP_NAME_KANNADA,
  BENGALURU_STATIONS,
  DEMO_QUERIES,
  DEMO_QUERY_KANNADA,
  INTELLIGENCE_PACKS,
  RESEARCH_SOURCES,
  ROLES
} from "@/lib/catalog";
import { GeoOpsMap } from "@/components/map/geo-ops-map";
import type {
  Alert,
  AuditLog,
  CopilotResult,
  DashboardSnapshot,
  Hotspot,
  NetworkGraph,
  RoleId,
  Station
} from "@/lib/types";

type ViewId =
  | "command"
  | "copilot"
  | "map"
  | "station"
  | "network"
  | "alerts"
  | "brief"
  | "audit"
  | "trust";

interface KavachaAppProps {
  initialSnapshot: DashboardSnapshot;
}

interface RealtimeEvent {
  sequence: number;
  timestamp: string;
  stationId: string;
  station: string;
  beat: string;
  signal: string;
  riskScore: number;
  alert: Alert;
}

type CopilotApiMode = "online" | "offline-fallback";
type RealtimeMode = "sse" | "polling" | "offline";
type MapMode = "geoops" | "fallback";
type AuditMode = "API" | "Memory fallback";

interface VoiceInsight {
  inputLanguage: string;
  translation: string;
  confidence: number;
  fallback: string;
}

interface AppStatus {
  runtime: string;
  data: string;
  copilot: CopilotApiMode;
  realtime: RealtimeMode;
  map: MapMode;
  graph: string;
  audit: AuditMode;
  privacy: string;
}

interface GraphQueryResponse {
  mode: string;
  graph: NetworkGraph;
  components: string[][];
  centrality: Array<{ id: string; label: string; degree: number }>;
  shortestPath: string[];
  edgeExplanation: {
    found: boolean;
    explanation: string;
  };
}

interface BrowserSpeechRecognitionResultEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (event: BrowserSpeechRecognitionResultEvent) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

const NAV_ITEMS: { id: ViewId; label: string; icon: LucideIcon }[] = [
  { id: "command", label: "Command Center", icon: Gauge },
  { id: "copilot", label: "Kavacha Copilot", icon: Bot },
  { id: "map", label: "Hotspot Map", icon: MapPinned },
  { id: "station", label: "Station Drilldown", icon: Route },
  { id: "network", label: "Network Graph", icon: Network },
  { id: "alerts", label: "Early Warnings", icon: Siren },
  { id: "brief", label: "Mission Brief", icon: FileText },
  { id: "audit", label: "Audit Trail", icon: Fingerprint },
  { id: "trust", label: "Trust Center", icon: ShieldCheck }
];

const HEAT_COLORS = ["#0f766e", "#d97706", "#b44435", "#3730a3"];

function cx(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

async function readJsonOrThrow<T>(response: Response, label: string): Promise<T> {
  if (!response.ok) throw new Error(`${label} failed with status ${response.status}`);
  const text = await response.text();
  if (!text.trim()) throw new Error(`${label} returned an empty response`);
  return JSON.parse(text) as T;
}

function buildClientRealtimeEvent(snapshot: DashboardSnapshot, sequence: number): RealtimeEvent {
  const station = BENGALURU_STATIONS[sequence % BENGALURU_STATIONS.length] ?? BENGALURU_STATIONS[0];
  const hotspot =
    snapshot.hotspots[sequence % snapshot.hotspots.length] ??
    snapshot.hotspots[0] ?? {
      stationId: station.id,
      station: station.name,
      district: station.district,
      beat: station.beat,
      lat: station.lat,
      lng: station.lng,
      crimeHeads: station.leadCategories,
      riskScore: station.risk,
      confidence: 0.82,
      trendDelta: station.trend,
      explanation: "Client realtime fallback from station risk catalogue.",
      patrolWindow: station.patrolWindow
    };
  const matchedStation = BENGALURU_STATIONS.find((item) => item.id === hotspot.stationId) ?? station;
  const timestamp = new Date().toISOString();
  const riskScore = Math.min(0.97, Math.max(0.54, hotspot.riskScore + (sequence % 4) * 0.012));
  const crimeHead = hotspot.crimeHeads[sequence % hotspot.crimeHeads.length] ?? matchedStation.leadCategories[0] ?? "Theft";
  const seedAlert = snapshot.alerts[sequence % snapshot.alerts.length];
  const signals = [
    "Client synthetic case ingest committed",
    "Hotspot confidence recalculated",
    "Patrol-window alert refreshed",
    "Graph evidence watchlist rescored"
  ];

  return {
    sequence,
    timestamp,
    stationId: matchedStation.id,
    station: matchedStation.name,
    beat: matchedStation.beat,
    signal: signals[sequence % signals.length],
    riskScore: Number(riskScore.toFixed(3)),
    alert: seedAlert
      ? {
          ...seedAlert,
          alert_id: `${seedAlert.alert_id}-client-${sequence}`,
          crime_head: crimeHead,
          area: `${matchedStation.name} / ${matchedStation.beat}`,
          confidence: Number(Math.min(0.96, Math.max(seedAlert.confidence, riskScore)).toFixed(2)),
          updated_at: timestamp
        }
      : {
          alert_id: `ALERT-CLIENT-${sequence}`,
          crime_head: crimeHead,
          area: `${matchedStation.name} / ${matchedStation.beat}`,
          confidence: Number(Math.min(0.94, riskScore).toFixed(2)),
          severity: riskScore > 0.86 ? "urgent" : riskScore > 0.74 ? "elevated" : "watch",
          explanation: `${matchedStation.name} synthetic live signal rose during ${matchedStation.patrolWindow}.`,
          recommended_action: "Review beat-level patrol plan and approve any field action manually.",
          updated_at: timestamp
        }
  };
}

function buildLocalGraphResponse(graph: NetworkGraph): GraphQueryResponse {
  const centrality = graph.nodes
    .map((node) => ({
      id: node.id,
      label: node.label,
      degree: graph.edges.filter((edge) => edge.source === node.id || edge.target === node.id).length
    }))
    .sort((left, right) => right.degree - left.degree)
    .slice(0, 8);

  return {
    mode: "local POLE graph fallback",
    graph,
    components: graph.nodes.length > 0 ? [graph.nodes.map((node) => node.id)] : [],
    centrality,
    shortestPath: graph.edges[0] ? [graph.edges[0].source, graph.edges[0].target] : [],
    edgeExplanation: {
      found: graph.edges.length > 0,
      explanation: "Client snapshot graph active while the deployed graph API is unavailable."
    }
  };
}

function buildClientFallbackCopilotResult(
  query: string,
  role: RoleId,
  snapshot: DashboardSnapshot
): CopilotResult {
  const timestamp = new Date().toISOString();
  const hotspots = snapshot.hotspots.slice(0, role === "sho" ? 5 : 6);
  const top = hotspots.slice(0, 3).map((item) => item.station).join(", ");
  const requestId = `KAV-OFFLINE-${Date.now()}`;
  const generatedZcql = `SELECT station, crime_head, COUNT(case_id) AS cases
FROM cases
WHERE report_month = '2026-05'
  AND district = 'Bengaluru City'
GROUP BY station, crime_head
ORDER BY cases DESC
LIMIT 10;`;
  const generatedCypher = `MATCH (c:Case)-[:HAS_MO|USES_PHONE|USES_BANK|USES_VEHICLE*1..2]-(n)
WHERE c.month = "2026-05"
RETURN c.case_id, labels(n), n.masked_id
LIMIT 50;`;
  const outputHash = `offline-${requestId}`;
  const rows = hotspots.slice(0, 10).map((hotspot) => ({
    station: hotspot.station,
    beat: hotspot.beat,
    crime_heads: hotspot.crimeHeads.join(", "),
    risk_score: hotspot.riskScore,
    confidence: hotspot.confidence,
    trend_delta: hotspot.trendDelta
  }));

  return {
    requestId,
    answer: `Offline demo engine result: strongest Bengaluru City signals are ${top}. Kavacha is running in API-free mode using synthetic SCRB-style data, local hotspot scoring, local graph evidence, patrol planning, and audit-safe output. This is a real-time synthetic SCRB-style stream, ready for authorised SCRB/CCTNS feed. No live KSP data or individual prediction is used.`,
    kannadaAnswer: `Kannada summary: main watch areas are ${top}. This is area, time, and category intelligence only. Individual profiling is not used.`,
    confidence: 0.88,
    engines: ["ZCQL aggregate", "PostGIS hotspot", "GraphRAG", "QuickML risk", "Report engine"],
    hotspots,
    patrolPlan: hotspots.slice(0, 4).map((hotspot, index) => ({
      dayRange: `Demo window ${index + 1}`,
      area: `${hotspot.station} / ${hotspot.beat}`,
      window: hotspot.patrolWindow,
      focus: hotspot.crimeHeads.join(" + "),
      rationale: `${Math.round(hotspot.riskScore * 100)} risk score, ${hotspot.trendDelta}% trend signal.`
    })),
    graph: snapshot.graph,
    generatedZcql,
    generatedCypher,
    queryValidation: {
      status: "passed",
      allowedClauses: ["SELECT", "WHERE", "GROUP BY", "ORDER BY", "LIMIT"],
      blockedTerms: [],
      reason: "Offline client fallback uses read-only generated ZCQL."
    },
    zcqlExecution: {
      mode: "synthetic-fallback",
      validation: {
        status: "passed",
        allowedClauses: ["SELECT", "WHERE", "GROUP BY", "ORDER BY", "LIMIT"],
        blockedTerms: [],
        reason: "Client fallback executed against synthetic snapshot rows."
      },
      rows
    },
    limitations: [
      "Offline fallback uses synthetic SCRB-style data.",
      "No live KSP/CCTNS data is connected.",
      "Human approval is required before any operational action."
    ],
    nextActions: [
      "Review hotspot explanation.",
      "Open graph link evidence.",
      "Export mission brief after API is restored."
    ],
    citations: ["Synthetic SCRB-style data", "Kavacha local graph", "KSP public aggregate basis"],
    audit: {
      audit_id: `AUD-OFFLINE-${Date.now()}`,
      user_id: `demo.${role}`,
      role,
      query,
      language: /[\u0C80-\u0CFF]/.test(query) ? "Kannada" : "English",
      intent: "Offline fallback query",
      generated_zcql: generatedZcql,
      generated_cypher: generatedCypher,
      data_sources: ["Synthetic SCRB-style client fallback"],
      model_used: "Kavacha offline deterministic client fallback",
      engines: ["ZCQL aggregate", "PostGIS hotspot", "GraphRAG"],
      timestamp,
      confidence: 0.88,
      output_hash: outputHash,
      evidence_hash: outputHash,
      officer_action: "Human approval required before patrol deployment"
    },
    metrics: {
      mayCyberCases: snapshot.officialStats.may2026Cyber,
      mayTheftCases: snapshot.officialStats.may2026Theft,
      mayNdpsCases: snapshot.officialStats.may2026Ndps,
      mayPocsoCases: snapshot.officialStats.may2026Pocso,
      casesAnalysed: snapshot.caseCount
    }
  };
}

export function KavachaApp({ initialSnapshot }: KavachaAppProps) {
  const [activeView, setActiveView] = useState<ViewId>("command");
  const [role, setRole] = useState<RoleId>("scrb_admin");
  const [query, setQuery] = useState(DEMO_QUERY_KANNADA);
  const [copilotResult, setCopilotResult] = useState<CopilotResult | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "unsupported">("idle");
  const [voiceInsight, setVoiceInsight] = useState<VoiceInsight | null>(null);
  const [liveEvents, setLiveEvents] = useState<RealtimeEvent[]>([]);
  const [systemNotice, setSystemNotice] = useState<string | null>(null);
  const [copilotApiMode, setCopilotApiMode] = useState<CopilotApiMode>("online");
  const [realtimeMode, setRealtimeMode] = useState<RealtimeMode>("sse");
  const [mapMode, setMapMode] = useState<MapMode>("geoops");
  const [graphMode, setGraphMode] = useState("local POLE graph fallback");
  const [auditMode, setAuditMode] = useState<AuditMode>("Memory fallback");
  const [selectedStationId, setSelectedStationId] = useState(initialSnapshot.hotspots[0]?.stationId ?? "blr-whitefield");

  const selectedStation = useMemo(
    () => BENGALURU_STATIONS.find((station) => station.id === selectedStationId) ?? BENGALURU_STATIONS[0],
    [selectedStationId]
  );

  const visibleHotspots = copilotResult?.hotspots ?? initialSnapshot.hotspots;
  const visibleGraph = copilotResult?.graph ?? initialSnapshot.graph;
  const liveEvent = liveEvents[0];
  const appStatus: AppStatus = {
    runtime: "Node/AppSail",
    data: "Synthetic / Catalyst-ready",
    copilot: copilotApiMode,
    realtime: realtimeMode,
    map: mapMode,
    graph: graphMode,
    audit: auditMode,
    privacy: "PII masked, sensitive aggregate-only"
  };

  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let clientTimer: ReturnType<typeof setInterval> | undefined;
    let startupTimer: ReturnType<typeof setTimeout> | undefined;
    let pollingStarted = false;
    let clientStarted = false;
    let gotServerEvent = false;
    let clientSequence = 0;
    let eventSource: EventSource | null = null;

    function pushLiveEvent(payload: RealtimeEvent, mode: RealtimeMode) {
      setLiveEvents((events) => [payload, ...events].slice(0, 8));
      if (payload.stationId) setSelectedStationId(payload.stationId);
      setRealtimeMode(mode);
    }

    function pushClientEvent() {
      const payload = buildClientRealtimeEvent(initialSnapshot, clientSequence);
      clientSequence += 1;
      pushLiveEvent(payload, "offline");
    }

    function startClientRealtime() {
      if (clientStarted) return;
      clientStarted = true;
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
      setSystemNotice("Zoho realtime APIs returned empty data. Client realtime stream activated.");
      pushClientEvent();
      clientTimer = setInterval(pushClientEvent, 3500);
    }

    function startPolling() {
      if (pollingStarted || clientStarted) return;
      pollingStarted = true;
      eventSource?.close();
      void pollRealtime();
      pollTimer = setInterval(() => void pollRealtime(), 5000);
    }

    async function pollRealtime() {
      try {
        const response = await fetch("/api/realtime/poll", { cache: "no-store" });
        const payload = await readJsonOrThrow<RealtimeEvent>(response, "Realtime poll");
        gotServerEvent = true;
        pushLiveEvent(payload, "polling");
      } catch {
        startClientRealtime();
      }
    }

    if (typeof EventSource === "undefined") {
      startPolling();
      return () => {
        if (pollTimer) clearInterval(pollTimer);
        if (clientTimer) clearInterval(clientTimer);
      };
    }

    eventSource = new EventSource("/api/realtime");
    const handleUpdate = (message: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(message.data) as RealtimeEvent;
        gotServerEvent = true;
        pushLiveEvent(payload, "sse");
      } catch {
        startPolling();
      }
    };

    eventSource.addEventListener("ready", handleUpdate);
    eventSource.addEventListener("update", handleUpdate);
    eventSource.onerror = () => {
      startPolling();
    };
    startupTimer = setTimeout(() => {
      if (!gotServerEvent) startPolling();
    }, 4500);

    return () => {
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
      if (clientTimer) clearInterval(clientTimer);
      if (startupTimer) clearTimeout(startupTimer);
    };
  }, [initialSnapshot]);

  useEffect(() => {
    void refreshAuditLogs();
  }, []);

  async function refreshAuditLogs() {
    try {
      const response = await fetch("/api/audit", { cache: "no-store" });
      const data = await readJsonOrThrow<{ mode?: string; logs: AuditLog[] }>(response, "Audit");
      setAuditLogs(Array.isArray(data.logs) ? data.logs : []);
      setAuditMode(data.mode?.toLowerCase().includes("catalyst") ? "API" : "Memory fallback");
    } catch {
      const fallbackAudit = copilotResult?.audit ?? buildClientFallbackCopilotResult(query, role, initialSnapshot).audit;
      setAuditLogs((logs) => [fallbackAudit, ...logs.filter((log) => log.audit_id !== fallbackAudit.audit_id)].slice(0, 100));
      setAuditMode("Memory fallback");
      setSystemNotice("Audit API unavailable. Showing local demo audit state.");
    }
  }

  async function runQuery(nextQuery = query) {
    setLoading(true);
    setSystemNotice(null);
    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nextQuery, role, userId: `demo.${role}` })
      });

      const result = await readJsonOrThrow<CopilotResult>(response, "Copilot");
      setCopilotApiMode("online");
      setCopilotResult(result);
      setAuditLogs((logs) => [result.audit, ...logs.filter((log) => log.audit_id !== result.audit.audit_id)].slice(0, 100));
      setActiveView("copilot");
      try {
        await refreshAuditLogs();
      } catch {
        setSystemNotice("Audit API unavailable. Showing local demo audit state.");
      }
    } catch {
      const fallback = buildClientFallbackCopilotResult(nextQuery, role, initialSnapshot);
      setCopilotApiMode("offline-fallback");
      setCopilotResult(fallback);
      setAuditLogs((logs) => [fallback.audit, ...logs.filter((log) => log.audit_id !== fallback.audit.audit_id)].slice(0, 100));
      setAuditMode("Memory fallback");
      setActiveView("copilot");
      setSystemNotice("Copilot API unavailable. Offline deterministic demo engine activated.");
    } finally {
      setLoading(false);
    }
  }

  async function processVoiceText(text: string) {
    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const payload = await readJsonOrThrow<VoiceInsight>(response, "Voice");
      const canonical = payload.translation || text;
      setVoiceInsight(payload);
      setQuery(canonical);
      await runQuery(canonical);
    } catch {
      const fallbackInsight: VoiceInsight = {
        inputLanguage: /[\u0C80-\u0CFF]/.test(text) ? "Kannada" : "English",
        translation: text,
        confidence: 0.72,
        fallback: "browser/demo fallback"
      };
      setVoiceInsight(fallbackInsight);
      setQuery(text);
      setSystemNotice("Voice API unavailable. Browser/demo fallback text was used.");
      await runQuery(text);
    }
  }

  function startVoice() {
    const windowWithSpeech = window as Window & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    };
    const SpeechRecognition = windowWithSpeech.SpeechRecognition ?? windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceState("unsupported");
      void processVoiceText(DEMO_QUERY_KANNADA);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "kn-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) void processVoiceText(transcript);
    };
    recognition.onerror = () => setVoiceState("unsupported");
    recognition.onend = () => setVoiceState("idle");
    setVoiceState("listening");
    recognition.start();
  }

  function speakResult() {
    if (!copilotResult || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(copilotResult.kannadaAnswer);
    utterance.lang = "kn-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  const ActiveIcon = NAV_ITEMS.find((item) => item.id === activeView)?.icon ?? Gauge;

  return (
    <main className="min-h-screen text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-[1600px] gap-4 p-3 sm:p-4 lg:p-5">
        <aside className="hidden w-[284px] shrink-0 flex-col rounded-lg border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow)] lg:flex">
          <div className="border-b border-[var(--line)] p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--ink)] text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-semibold leading-tight">{APP_NAME}</div>
                <div className="text-sm font-medium text-[var(--teal)]">{APP_NAME_KANNADA}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-[var(--line)] bg-[#f4fbf8] px-3 py-2 text-sm text-[var(--teal-ink)]">
              <Radio className="h-4 w-4" />
              <span>{liveEvent ? `${liveEvent.signal} · ${liveEvent.station}` : "Real-time stream connecting"}</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={cx(
                    "flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition",
                    activeView === item.id
                      ? "bg-[var(--ink)] text-white"
                      : "text-[#34423d] hover:bg-[#edf3ef] hover:text-[var(--ink)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-[var(--line)] p-4">
            <RolePicker role={role} setRole={setRole} />
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="mb-4 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-[#e8f4ef] text-[var(--teal)]">
                  <ActiveIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    Karnataka State Police Intelligence Loop
                  </div>
                  <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                    {NAV_ITEMS.find((item) => item.id === activeView)?.label}
                  </h1>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex gap-1 overflow-x-auto rounded-md border border-[var(--line)] bg-[#f8faf7] p-1">
                  {ROLES.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setRole(item.id)}
                      className={cx(
                        "h-9 shrink-0 rounded px-3 text-sm font-semibold transition",
                        role === item.id
                          ? "bg-[var(--teal)] text-white"
                          : "text-[#3f4a46] hover:bg-white"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => void runQuery(DEMO_QUERY_KANNADA)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#293137]"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Run Judge Query
                </button>
              </div>
            </div>
          </header>

          <div className="lg:hidden">
            <div className="mb-4 flex gap-2 overflow-x-auto rounded-lg border border-[var(--line)] bg-[var(--panel)] p-2 shadow-[var(--shadow)]">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    title={item.label}
                    className={cx(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-md",
                      activeView === item.id ? "bg-[var(--ink)] text-white" : "bg-[#f1f4f0] text-[#3f4a46]"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {activeView === "command" && (
            <CommandCenter
              snapshot={initialSnapshot}
              liveEvents={liveEvents}
              setActiveView={setActiveView}
              appStatus={appStatus}
              systemNotice={systemNotice}
            />
          )}
          {activeView === "copilot" && (
            <CopilotPanel
              query={query}
              setQuery={setQuery}
              runQuery={runQuery}
              loading={loading}
              result={copilotResult}
              startVoice={startVoice}
              voiceState={voiceState}
              voiceInsight={voiceInsight}
              speakResult={speakResult}
              systemNotice={systemNotice}
              copilotApiMode={copilotApiMode}
            />
          )}
          {activeView === "map" && (
            <HotspotMap
              hotspots={visibleHotspots}
              liveEvent={liveEvent}
              selectedStationId={selectedStationId}
              setSelectedStationId={setSelectedStationId}
              setMapMode={setMapMode}
            />
          )}
          {activeView === "station" && (
            <StationDrilldown
              station={selectedStation}
              hotspots={visibleHotspots}
              setSelectedStationId={setSelectedStationId}
              role={role}
            />
          )}
          {activeView === "network" && (
            <NetworkGraphPanel
              graph={visibleGraph}
              moFingerprints={initialSnapshot.moFingerprints}
              setGraphMode={setGraphMode}
            />
          )}
          {activeView === "alerts" && <AlertsPanel alerts={initialSnapshot.alerts} liveEvents={liveEvents} />}
          {activeView === "brief" && (
            <MissionBrief result={copilotResult} snapshot={initialSnapshot} role={role} runQuery={runQuery} />
          )}
          {activeView === "audit" && <AuditTrail logs={auditLogs} refreshAuditLogs={refreshAuditLogs} />}
          {activeView === "trust" && <TrustCenter snapshot={initialSnapshot} role={role} />}
        </section>
      </div>
    </main>
  );
}

function RolePicker({ role, setRole }: { role: RoleId; setRole: (role: RoleId) => void }) {
  const current = ROLES.find((item) => item.id === role) ?? ROLES[0];
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Active Role</div>
      <select
        value={role}
        onChange={(event) => setRole(event.target.value as RoleId)}
        className="h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold outline-none ring-[var(--teal)] focus:ring-2"
      >
        {ROLES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{current.scope}</p>
    </div>
  );
}

function SectionShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function Panel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("rounded-lg border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow)]", className)}>
      {children}
    </section>
  );
}

function PanelTitle({ icon: Icon, title, action }: { icon: LucideIcon; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--teal)]" />
        <h2 className="truncate text-sm font-semibold uppercase tracking-[0.08em] text-[#34423d]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-[var(--muted)]">{label}</div>
        <div className={cx("grid h-9 w-9 place-items-center rounded-md text-white", tone)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function CommandCenter({
  snapshot,
  liveEvents,
  setActiveView,
  appStatus,
  systemNotice
}: {
  snapshot: DashboardSnapshot;
  liveEvents: RealtimeEvent[];
  setActiveView: (view: ViewId) => void;
  appStatus: AppStatus;
  systemNotice: string | null;
}) {
  const latest = liveEvents[0];
  return (
    <SectionShell>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={Database} label="Synthetic CCTNS Records" value={formatNumber(snapshot.caseCount)} tone="bg-[var(--teal)]" />
        <MetricTile icon={Activity} label="May 2026 Theft" value={formatNumber(snapshot.officialStats.may2026Theft)} tone="bg-[var(--saffron)]" />
        <MetricTile icon={LockKeyhole} label="May 2026 Cyber" value={formatNumber(snapshot.officialStats.may2026Cyber)} tone="bg-[var(--indigo)]" />
        <MetricTile icon={ShieldCheck} label="Audit Mode" value="DPDP-safe" tone="bg-[var(--vermillion)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricTile icon={Database} label="Data Mode" value="Synthetic" tone="bg-[var(--teal)]" />
        <MetricTile icon={Radio} label="Stream" value="3.5 sec" tone="bg-[var(--saffron)]" />
        <MetricTile icon={Network} label="Graph" value="Local POLE" tone="bg-[var(--indigo)]" />
        <MetricTile icon={Activity} label="ML Mode" value="Local Risk" tone="bg-[var(--vermillion)]" />
        <MetricTile icon={ShieldCheck} label="Catalyst" value="Ready" tone="bg-[#6f8f72]" />
      </div>

      <AppStatusPanel status={appStatus} systemNotice={systemNotice} />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel>
          <PanelTitle icon={BarChart3} title="Karnataka Crime Trend Signals" />
          <div className="h-[340px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshot.trends} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="cyber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3730a3" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#3730a3" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="theft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#d8dfda" strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64706b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64706b" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #d8dfda" }} />
                <Area type="monotone" dataKey="theft" stroke="#d97706" fill="url(#theft)" strokeWidth={2} />
                <Area type="monotone" dataKey="cyber" stroke="#3730a3" fill="url(#cyber)" strokeWidth={2} />
                <Line type="monotone" dataKey="ndps" stroke="#0f766e" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelTitle icon={Radio} title="Live Operational Stream" />
          <div className="space-y-3 p-4">
            <div className="rounded-lg border border-[var(--line)] bg-[#f4fbf8] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--teal-ink)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--teal)]" />
                {latest ? latest.signal : "Awaiting event"}
              </div>
              <div className="mt-3 text-2xl font-semibold">{latest ? latest.station : "Kavacha stream"}</div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                {latest ? `${latest.beat} · ${Math.round(latest.riskScore * 100)} risk` : "SSE /api/realtime"}
              </div>
            </div>
            {liveEvents.slice(0, 5).map((event) => (
              <div key={`${event.sequence}-${event.timestamp}`} className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3 last:border-b-0">
                <div>
                  <div className="text-sm font-semibold">{event.station}</div>
                  <div className="text-xs text-[var(--muted)]">{event.signal}</div>
                </div>
                <div className="text-right text-xs font-semibold text-[var(--teal)]">{formatTime(event.timestamp)}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelTitle
          icon={ListChecks}
          title="Five Intelligence Packs"
          action={
            <button
              onClick={() => setActiveView("copilot")}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm font-semibold hover:bg-[#f5f7f4]"
            >
              <Search className="h-4 w-4" />
              Query
            </button>
          }
        />
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
          {INTELLIGENCE_PACKS.map((pack, index) => (
            <div key={pack.title} className="rounded-lg border border-[var(--line)] bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md text-sm font-bold text-white" style={{ backgroundColor: HEAT_COLORS[index % HEAT_COLORS.length] }}>
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold">{pack.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-5 text-[var(--muted)]">{pack.basis}</p>
              <div className="mt-3 rounded-md bg-[#f5f7f4] px-3 py-2 text-sm font-semibold text-[#34423d]">{pack.output}</div>
            </div>
          ))}
        </div>
      </Panel>
    </SectionShell>
  );
}

function AppStatusPanel({ status, systemNotice }: { status: AppStatus; systemNotice: string | null }) {
  const items = [
    ["Runtime", status.runtime],
    ["Data", status.data],
    ["Copilot API", status.copilot === "online" ? "Online" : "Offline fallback"],
    ["Realtime", status.realtime === "sse" ? "SSE" : status.realtime === "polling" ? "Polling" : "Offline"],
    ["Map", status.map === "geoops" ? "GeoOps" : "Fallback"],
    ["Graph", status.graph],
    ["Audit", status.audit],
    ["Privacy", status.privacy]
  ];

  return (
    <Panel>
      <PanelTitle icon={Activity} title="App Status" />
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[var(--line)] bg-white p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{label}</div>
            <div className="mt-1 text-sm font-semibold text-[#26312d]">{value}</div>
          </div>
        ))}
      </div>
      {systemNotice && (
        <div className="border-t border-[var(--line)] bg-[#fff8e9] px-4 py-3 text-sm font-semibold text-[#81500b]">
          {systemNotice}
        </div>
      )}
    </Panel>
  );
}

function CopilotPanel({
  query,
  setQuery,
  runQuery,
  loading,
  result,
  startVoice,
  voiceState,
  voiceInsight,
  speakResult,
  systemNotice,
  copilotApiMode
}: {
  query: string;
  setQuery: (query: string) => void;
  runQuery: (query?: string) => Promise<void>;
  loading: boolean;
  result: CopilotResult | null;
  startVoice: () => void;
  voiceState: "idle" | "listening" | "unsupported";
  voiceInsight: VoiceInsight | null;
  speakResult: () => void;
  systemNotice: string | null;
  copilotApiMode: CopilotApiMode;
}) {
  return (
    <SectionShell>
      {systemNotice && (
        <div className="rounded-lg border border-[#f0cf8a] bg-[#fff8e9] px-4 py-3 text-sm font-semibold text-[#81500b]">
          {systemNotice}
        </div>
      )}
      <Panel>
        <PanelTitle icon={Languages} title="Kannada-English Copilot" />
        <div className="grid gap-4 p-4 xl:grid-cols-[1fr_0.9fr]">
          <div>
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-[168px] w-full resize-y rounded-lg border border-[var(--line)] bg-[#fbfcfa] p-4 text-base leading-7 outline-none ring-[var(--teal)] focus:ring-2"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => void runQuery(query)}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--teal)] px-4 text-sm font-semibold text-white hover:bg-[var(--teal-ink)] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                Analyse
              </button>
              <button
                onClick={startVoice}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold hover:bg-[#f5f7f4]"
              >
                <Mic className="h-4 w-4" />
                {voiceState === "listening" ? "Listening" : voiceState === "unsupported" ? "Voice Fallback" : "Voice"}
              </button>
              <button
                onClick={() => setQuery(DEMO_QUERY_KANNADA)}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold hover:bg-[#f5f7f4]"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={speakResult}
                disabled={!result}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold hover:bg-[#f5f7f4] disabled:opacity-50"
              >
                <Volume2 className="h-4 w-4" />
                Kannada TTS
              </button>
            </div>
            {voiceInsight && (
              <div className="mt-3 grid gap-2 rounded-lg border border-[var(--line)] bg-white p-3 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Voice provider</div>
                  <div className="mt-1 font-semibold">{voiceInsight.fallback}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Input language</div>
                  <div className="mt-1 font-semibold">{voiceInsight.inputLanguage}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Translation confidence</div>
                  <div className="mt-1 font-semibold">{Math.round(voiceInsight.confidence * 100)}%</div>
                </div>
              </div>
            )}
            <div className="mt-4 rounded-lg border border-[var(--line)] bg-white p-3">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                <ListChecks className="h-4 w-4 text-[var(--teal)]" />
                Ten Demo Queries
              </div>
              <div className="grid max-h-[220px] gap-2 overflow-auto pr-1 kavacha-scrollbar">
                {DEMO_QUERIES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setQuery(item.query)}
                    className="rounded-md border border-[var(--line)] bg-[#fbfcfa] px-3 py-2 text-left transition hover:border-[var(--teal)] hover:bg-[#f1fbf7]"
                  >
                    <div className="text-sm font-semibold leading-5">{item.query}</div>
                    <div className="mt-1 text-xs font-semibold text-[var(--teal)]">{item.engine}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[#f8faf7] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Answer</div>
              <div className="flex flex-wrap justify-end gap-2">
                <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[var(--teal)]">
                  {result ? `${Math.round(result.confidence * 100)} confidence` : "Ready"}
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#34423d]">
                  {copilotApiMode === "online" ? "API online" : "Offline fallback"}
                </div>
              </div>
            </div>
            <p className="mt-4 text-base leading-7 text-[#26312d]">
              {result?.answer ??
                "Kavacha is ready with ZCQL aggregates, GraphRAG links, hotspot scoring, Kannada output, PDF brief generation, and audit logging."}
            </p>
            {result && (
              <p className="mt-4 rounded-md border border-[var(--line)] bg-white p-3 text-base leading-7 text-[#26312d]">
                {result.kannadaAnswer}
              </p>
            )}
            {result && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-[var(--line)] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Intent</div>
                  <div className="mt-1 text-sm font-semibold">{result.audit.intent}</div>
                </div>
                <div className="rounded-md border border-[var(--line)] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Language</div>
                  <div className="mt-1 text-sm font-semibold">{result.audit.language}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>

      {result && (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel>
            <PanelTitle icon={Database} title="Grounded Query Plan" />
            <div className="space-y-4 p-4">
              <div className="flex flex-wrap gap-2">
                {result.engines.map((engine) => (
                  <span key={engine} className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-sm font-semibold text-[#34423d]">
                    {engine}
                  </span>
                ))}
              </div>
              <div
                className={cx(
                  "rounded-lg border p-4",
                  result.queryValidation.status === "passed"
                    ? "border-[#b8ded0] bg-[#f1fbf7]"
                    : "border-[#f1c0b9] bg-[#fff2f1]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-[var(--teal)]" />
                    ZCQL Validator: {result.queryValidation.status}
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[var(--muted)]">
                    {result.queryValidation.allowedClauses.join(" · ")}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-5 text-[#34423d]">{result.queryValidation.reason}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[var(--line)] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Execution mode</div>
                  <div className="mt-1 text-sm font-semibold">{result.zcqlExecution.mode}</div>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Rows returned</div>
                  <div className="mt-1 text-sm font-semibold">{result.zcqlExecution.rows.length}</div>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Validation</div>
                  <div className="mt-1 text-sm font-semibold">{result.zcqlExecution.validation.status}</div>
                </div>
              </div>
              <CodeBlock title="Generated ZCQL / SQL" code={result.generatedZcql} />
              <CodeBlock title="Generated Cypher" code={result.generatedCypher} />
              <div className="grid gap-3">
                <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                  <div className="text-sm font-semibold text-[var(--muted)]">Limitations</div>
                  <ul className="mt-2 space-y-2 text-sm leading-5 text-[#34423d]">
                    {result.limitations.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                  <div className="text-sm font-semibold text-[var(--muted)]">Next Recommended Actions</div>
                  <ul className="mt-2 space-y-2 text-sm leading-5 text-[#34423d]">
                    {result.nextActions.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelTitle icon={Route} title="Two-Week Patrol Plan" />
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {result.patrolPlan.map((item) => (
                <div key={`${item.dayRange}-${item.area}`} className="rounded-lg border border-[var(--line)] bg-white p-4">
                  <div className="text-sm font-semibold text-[var(--teal)]">{item.dayRange}</div>
                  <div className="mt-2 text-lg font-semibold">{item.area}</div>
                  <div className="mt-1 text-sm font-medium text-[var(--muted)]">{item.window}</div>
                  <div className="mt-3 rounded-md bg-[#f5f7f4] px-3 py-2 text-sm font-semibold">{item.focus}</div>
                  <p className="mt-3 text-sm leading-5 text-[var(--muted)]">{item.rationale}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </SectionShell>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{title}</div>
      <pre className="max-h-[180px] overflow-auto rounded-lg border border-[var(--line)] bg-[#14181b] p-3 text-xs leading-5 text-[#eaf2ed] kavacha-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function HotspotMap({
  hotspots,
  liveEvent,
  selectedStationId,
  setSelectedStationId,
  setMapMode
}: {
  hotspots: Hotspot[];
  liveEvent?: RealtimeEvent;
  selectedStationId: string;
  setSelectedStationId: (stationId: string) => void;
  setMapMode: (mode: MapMode) => void;
}) {
  return (
    <SectionShell>
      <Panel>
        <PanelTitle icon={MapPinned} title="Bengaluru Hotspot Intelligence" />
        <div className="grid gap-4 p-4 xl:grid-cols-[1.4fr_0.6fr]">
          <GeoOpsMap
            hotspots={hotspots}
            selectedStationId={selectedStationId}
            setSelectedStationId={setSelectedStationId}
            liveEvent={liveEvent}
            onModeChange={setMapMode}
          />

          <div className="space-y-3">
            {hotspots.slice(0, 7).map((hotspot, index) => (
              <button
                key={hotspot.stationId}
                onClick={() => setSelectedStationId(hotspot.stationId)}
                className={cx(
                  "w-full rounded-lg border p-4 text-left transition",
                  selectedStationId === hotspot.stationId
                    ? "border-[var(--teal)] bg-[#f1fbf7]"
                    : "border-[var(--line)] bg-white hover:bg-[#f8faf7]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{hotspot.station}</div>
                    <div className="text-xs text-[var(--muted)]">{hotspot.beat}</div>
                  </div>
                  <div className="text-right text-sm font-semibold text-[var(--teal)]">{Math.round(hotspot.riskScore * 100)}</div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e4ece7]">
                  <div className="h-full rounded-full" style={{ width: `${hotspot.riskScore * 100}%`, backgroundColor: HEAT_COLORS[index % HEAT_COLORS.length] }} />
                </div>
                <div className="mt-2 text-xs font-semibold text-[#34423d]">{hotspot.crimeHeads.join(" + ")}</div>
              </button>
            ))}
          </div>
        </div>
      </Panel>
    </SectionShell>
  );
}

function StationDrilldown({
  station,
  hotspots,
  setSelectedStationId,
  role
}: {
  station: Station;
  hotspots: Hotspot[];
  setSelectedStationId: (stationId: string) => void;
  role: RoleId;
}) {
  const barData = hotspots.slice(0, 6).map((hotspot) => ({
    station: hotspot.station,
    risk: Math.round(hotspot.riskScore * 100),
    trend: hotspot.trendDelta
  }));
  const currentRole = ROLES.find((item) => item.id === role) ?? ROLES[0];

  return (
    <SectionShell>
      <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <Panel>
          <PanelTitle icon={Route} title="Station Command" />
          <div className="p-4">
            <div className="rounded-lg border border-[var(--line)] bg-[#f8faf7] p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{station.division}</div>
              <h2 className="mt-2 text-3xl font-semibold">{station.name}</h2>
              <div className="mt-2 text-sm font-semibold text-[var(--teal)]">{station.beat} · {station.zone}</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-white p-3">
                  <div className="text-xs text-[var(--muted)]">Risk</div>
                  <div className="text-xl font-semibold">{Math.round(station.risk * 100)}</div>
                </div>
                <div className="rounded-md bg-white p-3">
                  <div className="text-xs text-[var(--muted)]">Trend</div>
                  <div className="text-xl font-semibold">+{station.trend}%</div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {BENGALURU_STATIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedStationId(item.id)}
                  className={cx(
                    "flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm font-semibold",
                    item.id === station.id ? "border-[var(--teal)] bg-[#f1fbf7]" : "border-[var(--line)] bg-white"
                  )}
                >
                  <span>{item.name}</span>
                  <span className="text-[var(--muted)]">{item.beat}</span>
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelTitle icon={BarChart3} title="Beat-Level Risk Comparison" />
          <div className="grid gap-4 p-4 xl:grid-cols-[1fr_0.75fr]">
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 12, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid stroke="#d8dfda" strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="station" tickLine={false} axisLine={false} width={95} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #d8dfda" }} />
                  <Bar dataKey="risk" radius={[0, 8, 8, 0]}>
                    {barData.map((item, index) => (
                      <Cell key={item.station} fill={HEAT_COLORS[index % HEAT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                <div className="text-sm font-semibold text-[var(--muted)]">Access Scope</div>
                <div className="mt-2 text-lg font-semibold">{currentRole.label}</div>
                <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{currentRole.scope}</p>
              </div>
              <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                <div className="text-sm font-semibold text-[var(--muted)]">Patrol Window</div>
                <div className="mt-2 text-lg font-semibold">{station.patrolWindow}</div>
                <div className="mt-2 text-sm font-semibold text-[var(--teal)]">{station.leadCategories.join(" + ")}</div>
              </div>
              <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                <div className="text-sm font-semibold text-[var(--muted)]">Privacy Mask</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--teal)]">
                  <CheckCircle2 className="h-4 w-4" />
                  Hashed FIR, person, phone, bank, vehicle
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </SectionShell>
  );
}

function NetworkGraphPanel({
  graph,
  moFingerprints,
  setGraphMode
}: {
  graph: NetworkGraph;
  moFingerprints: DashboardSnapshot["moFingerprints"];
  setGraphMode: (mode: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [graphState, setGraphState] = useState(graph);
  const [graphMeta, setGraphMeta] = useState<GraphQueryResponse | null>(null);
  const [graphStatus, setGraphStatus] = useState("Loading /api/graph/query");
  const [selectedEdge, setSelectedEdge] = useState<NetworkGraph["edges"][number] | null>(
    graph.edges[0] ?? null
  );

  useEffect(() => {
    setGraphState(graph);
    setSelectedEdge(graph.edges[0] ?? null);
  }, [graph]);

  useEffect(() => {
    let cancelled = false;

    async function loadGraph() {
      try {
        const response = await fetch("/api/graph/query", { cache: "no-store" });
        const payload = await readJsonOrThrow<GraphQueryResponse>(response, "Graph query");
        if (cancelled) return;
        setGraphState(payload.graph);
        setSelectedEdge(payload.graph.edges[0] ?? null);
        setGraphMeta(payload);
        setGraphStatus("Graph query executed");
        setGraphMode(payload.mode);
      } catch {
        if (cancelled) return;
        const fallback = buildLocalGraphResponse(graph);
        setGraphMeta(fallback);
        setGraphState(fallback.graph);
        setSelectedEdge(fallback.graph.edges[0] ?? null);
        setGraphStatus("Local snapshot graph fallback active");
        setGraphMode("local POLE graph fallback");
      }
    }

    void loadGraph();

    return () => {
      cancelled = true;
    };
  }, [setGraphMode]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let cy: cytoscape.Core | null = null;
    let resizeObserver: ResizeObserver | null = null;

    cy = cytoscape({
      container,
      elements: [
        ...graphState.nodes.map((node) => ({
          data: { id: node.id, label: node.label, type: node.type, risk: node.risk ?? 0.5 }
        })),
        ...graphState.edges.map((edge) => ({ data: edge }))
      ],
      layout: {
        name: "cose",
        animate: false,
        fit: true,
        padding: 42,
        randomize: false,
        nodeRepulsion: 480000,
        idealEdgeLength: 100,
        numIter: 600
      },
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "font-size": 11,
            "font-weight": 700,
            color: "#14181b",
            "text-valign": "bottom",
            "text-halign": "center",
            "background-color": "#0f766e",
            "border-width": 2,
            "border-color": "#ffffff",
            width: "mapData(risk, 0.4, 1, 34, 58)",
            height: "mapData(risk, 0.4, 1, 34, 58)"
          }
        },
        { selector: 'node[type = "case"]', style: { "background-color": "#b44435" } },
        { selector: 'node[type = "person"]', style: { "background-color": "#d97706" } },
        { selector: 'node[type = "phone"]', style: { "background-color": "#3730a3" } },
        { selector: 'node[type = "bank"]', style: { "background-color": "#6f8f72" } },
        { selector: 'node[type = "vehicle"]', style: { "background-color": "#0f766e" } },
        { selector: 'node[type = "mo"]', style: { "background-color": "#14181b" } },
        {
          selector: "edge",
          style: {
            label: "data(label)",
            "font-size": 9,
            color: "#64706b",
            "curve-style": "bezier",
            width: "mapData(strength, 0.6, 1, 2, 5)",
            "line-color": "#a9bbb2",
            "target-arrow-color": "#a9bbb2",
            "target-arrow-shape": "triangle"
          }
        },
        {
          selector: "edge:selected",
          style: {
            "line-color": "#b44435",
            "target-arrow-color": "#b44435",
            width: 5
          }
        }
      ]
    });

    cy.on("tap", "edge", (event) => {
      const edge = event.target.data() as NetworkGraph["edges"][number];
      setSelectedEdge(edge);
    });

    resizeObserver = new ResizeObserver(() => {
      if (!cy || cy.destroyed()) return;
      cy.resize();
      cy.fit(undefined, 42);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver?.disconnect();
      if (cy && !cy.destroyed()) {
        cy.removeAllListeners();
        cy.elements().stop(true);
        cy.destroy();
      }
    };
  }, [graphState]);

  return (
    <SectionShell>
      <Panel>
        <PanelTitle icon={GitBranch} title="GraphRAG Criminal Network" />
        <div className="grid gap-4 p-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div ref={containerRef} className="cytoscape-shell h-[560px] rounded-lg border border-[var(--line)] bg-[#f8faf7]" />
          <div className="space-y-3">
            <div className="rounded-lg border border-[var(--line)] bg-white p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Graph Summary</div>
              <p className="mt-3 text-sm leading-6 text-[#34423d]">{graphState.summary}</p>
              <div className="mt-3 grid gap-2 text-xs font-semibold text-[#34423d]">
                <div className="rounded-md bg-[#f5f7f4] px-3 py-2">Mode: {graphMeta?.mode ?? "local POLE graph fallback"}</div>
                <div className="rounded-md bg-[#f5f7f4] px-3 py-2">Algorithm: connected components, shortest path, degree centrality</div>
                <div className="rounded-md bg-[#f5f7f4] px-3 py-2">
                  {graphStatus} - {graphMeta?.components.length ?? 0} components - {graphMeta?.centrality.length ?? 0} ranked nodes
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[#f8faf7] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Edge Explanation
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[var(--teal)]">
                  {selectedEdge ? Math.round(selectedEdge.strength * 100) : 0} strength
                </span>
              </div>
              {selectedEdge ? (
                <>
                  <div className="mt-3 text-base font-semibold">{selectedEdge.label}</div>
                  <div className="mt-1 text-sm font-semibold text-[var(--teal)]">{selectedEdge.reason}</div>
                  <ul className="mt-3 space-y-2 text-sm leading-5 text-[#34423d]">
                    {selectedEdge.evidence_points.map((point) => (
                      <li key={point}>• {point}</li>
                    ))}
                  </ul>
                  <div className="mt-3 text-xs font-semibold text-[var(--muted)]">Last seen: {selectedEdge.last_seen}</div>
                </>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">Select an edge to inspect the evidence strength.</p>
              )}
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-white p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">MO Fingerprints</div>
              <div className="mt-3 space-y-3">
                {moFingerprints.map((fingerprint) => (
                  <div key={fingerprint.id} className="rounded-md bg-[#f5f7f4] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{fingerprint.id}: {fingerprint.title}</div>
                      <span className="text-xs font-bold text-[var(--teal)]">
                        {Math.round(fingerprint.confidence * 100)}%
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{fingerprint.commonPattern}</div>
                    <div className="mt-2 text-xs font-semibold text-[#34423d]">
                      {fingerprint.linkedCases} linked cases · {fingerprint.districts.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {[
              ["Case", "#b44435"],
              ["Person hash", "#d97706"],
              ["Phone hash", "#3730a3"],
              ["Bank hash", "#6f8f72"],
              ["MO tag", "#14181b"]
            ].map(([label, color]) => (
              <div key={label} className="flex items-center justify-between rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </span>
                <span className="text-[var(--muted)]">masked</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </SectionShell>
  );
}

function AlertsPanel({ alerts, liveEvents }: { alerts: Alert[]; liveEvents: RealtimeEvent[] }) {
  const merged = [...liveEvents.map((event) => event.alert), ...alerts].slice(0, 9);
  const [patrolUnits, setPatrolUnits] = useState(2);
  const [approvedAlerts, setApprovedAlerts] = useState<Record<string, "approved" | "dismissed">>({});
  const coveredHotspots = Math.min(merged.length, Math.max(1, patrolUnits * 2));
  const coverage = Math.min(92, 48 + patrolUnits * 11);

  return (
    <SectionShell>
      <Panel>
        <PanelTitle icon={SlidersHorizontal} title="What-If Patrol Simulator" />
        <div className="grid gap-4 p-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg border border-[var(--line)] bg-[#f8faf7] p-4">
            <label className="text-sm font-semibold text-[var(--muted)]" htmlFor="patrol-units">
              Additional patrol units
            </label>
            <input
              id="patrol-units"
              type="range"
              min={1}
              max={6}
              value={patrolUnits}
              onChange={(event) => setPatrolUnits(Number(event.target.value))}
              className="mt-4 w-full accent-[var(--teal)]"
            />
            <div className="mt-3 text-3xl font-semibold">{patrolUnits}</div>
            <p className="mt-2 text-sm leading-5 text-[var(--muted)]">
              Coverage improvement estimate only. Kavacha does not claim exact crime reduction.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricTile icon={MapPinned} label="Hotspots Covered" value={`${coveredHotspots}/${merged.length}`} tone="bg-[var(--teal)]" />
            <MetricTile icon={Activity} label="Coverage Estimate" value={`${coverage}%`} tone="bg-[var(--saffron)]" />
            <MetricTile icon={UserCheck} label="Approval Gate" value="Required" tone="bg-[var(--vermillion)]" />
          </div>
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {merged.map((alert, index) => (
          <div key={`${alert.alert_id}-${index}`} className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-[var(--shadow)]">
            <div className="flex items-center justify-between gap-3">
              <div className={cx(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold",
                alert.severity === "urgent"
                  ? "bg-[#fdebea] text-[#9c2f25]"
                  : alert.severity === "elevated"
                    ? "bg-[#fff4df] text-[#9a5b08]"
                    : "bg-[#eef8f3] text-[var(--teal-ink)]"
              )}>
                <AlertTriangle className="h-4 w-4" />
                {alert.severity}
              </div>
              <span className="text-sm font-semibold text-[var(--teal)]">{Math.round(alert.confidence * 100)}%</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold">{alert.area}</h3>
            <div className="mt-1 text-sm font-semibold text-[var(--muted)]">{alert.crime_head}</div>
            <p className="mt-3 text-sm leading-6 text-[#34423d]">{alert.explanation}</p>
            <div className="mt-4 rounded-md bg-[#f5f7f4] px-3 py-2 text-sm font-semibold">{alert.recommended_action}</div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setApprovedAlerts((state) => ({ ...state, [alert.alert_id]: "approved" }))}
                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--teal)] px-3 text-sm font-semibold text-white hover:bg-[var(--teal-ink)]"
              >
                <UserCheck className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => setApprovedAlerts((state) => ({ ...state, [alert.alert_id]: "dismissed" }))}
                className="h-9 flex-1 rounded-md border border-[var(--line)] px-3 text-sm font-semibold hover:bg-[#f5f7f4]"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-3 text-xs font-semibold text-[var(--muted)]">
              Officer action: {approvedAlerts[alert.alert_id] ?? "pending human review"}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function MissionBrief({
  result,
  snapshot,
  role,
  runQuery
}: {
  result: CopilotResult | null;
  snapshot: DashboardSnapshot;
  role: RoleId;
  runQuery: (query?: string) => Promise<void>;
}) {
  async function exportPdf() {
    const activeResult = result;
    if (!activeResult) {
      await runQuery(DEMO_QUERY_KANNADA);
      return;
    }

    const { jsPDF } = await import("jspdf");
    const QRCode = await import("qrcode");
    const doc = new jsPDF();
    const auditUrl = `${window.location.origin}/?audit=${encodeURIComponent(activeResult.audit.audit_id)}`;
    const qrDataUrl = await QRCode.toDataURL(auditUrl, { margin: 1, width: 160 });
    const margin = 16;
    let y = 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Kavacha AI Mission Brief", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Role: ${role} | Request: ${activeResult.requestId} | Confidence: ${Math.round(activeResult.confidence * 100)}%`, margin, y);
    y += 10;

    const lines = doc.splitTextToSize(activeResult.answer, 178);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 8;

    doc.setFont("helvetica", "bold");
    doc.text("Hotspots", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    activeResult.hotspots.slice(0, 5).forEach((hotspot) => {
      doc.text(
        `${hotspot.station} / ${hotspot.beat} | Risk ${Math.round(hotspot.riskScore * 100)} | ${hotspot.crimeHeads.join(" + ")}`,
        margin,
        y
      );
      y += 6;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Patrol Plan", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    activeResult.patrolPlan.forEach((item) => {
      const patrolLines = doc.splitTextToSize(`${item.dayRange}: ${item.area}, ${item.window}. ${item.rationale}`, 178);
      doc.text(patrolLines, margin, y);
      y += patrolLines.length * 5 + 3;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Audit", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Audit ID: ${activeResult.audit.audit_id}`, margin, y);
    y += 5;
    doc.text(`Output hash: ${activeResult.audit.output_hash.slice(0, 32)}...`, margin, y);
    y += 5;
    doc.text(`Evidence hash: ${activeResult.audit.evidence_hash.slice(0, 32)}...`, margin, y);
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Confidence and Limitations", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    activeResult.limitations.forEach((item) => {
      const limitationLines = doc.splitTextToSize(`- ${item}`, 140);
      doc.text(limitationLines, margin, y);
      y += limitationLines.length * 5 + 2;
    });
    y += 3;
    doc.addImage(qrDataUrl, "PNG", 158, y - 34, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Officer Sign-off", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text("Reviewed by: ____________________", margin, y);
    y += 6;
    doc.text("Action approved / dismissed with reason: ____________________", margin, y);
    y += 7;
    doc.text("Sources: KSP Monthly Crime Review May 2026; DPDP Act 2023; Kavacha synthetic CCTNS schema.", margin, y);

    doc.save(`Kavacha-AI-Mission-Brief-${activeResult.requestId}.pdf`);
  }

  return (
    <SectionShell>
      <Panel>
        <PanelTitle
          icon={ClipboardList}
          title="Official Mission Brief"
          action={
            <button
              onClick={() => void exportPdf()}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--ink)] px-3 text-sm font-semibold text-white hover:bg-[#293137]"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          }
        />
        <div className="grid gap-4 p-4 xl:grid-cols-[1fr_0.75fr]">
          <div className="rounded-lg border border-[var(--line)] bg-[#fbfcfa] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Kavacha AI · ಕವಚ</div>
                <h2 className="mt-2 text-3xl font-semibold">Mission Brief</h2>
              </div>
              <ShieldCheck className="h-10 w-10 text-[var(--teal)]" />
            </div>
            <p className="mt-5 text-base leading-7 text-[#26312d]">
              {result?.answer ??
                "Run the judge query to generate a source-cited brief with hotspots, linked cases, patrol windows, confidence, and audit hash."}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(result?.patrolPlan ?? []).map((item) => (
                <div key={item.dayRange} className="rounded-md border border-[var(--line)] bg-white p-3">
                  <div className="text-sm font-semibold text-[var(--teal)]">{item.dayRange}</div>
                  <div className="mt-1 font-semibold">{item.area}</div>
                  <div className="text-sm text-[var(--muted)]">{item.window}</div>
                </div>
              ))}
            </div>
            {result && (
              <div className="mt-5 flex flex-col gap-3 rounded-lg border border-[var(--line)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--muted)]">QR Audit Record</div>
                  <div className="mt-1 font-mono text-xs">{result.audit.audit_id}</div>
                  <div className="mt-1 font-mono text-xs text-[var(--muted)]">
                    {result.audit.evidence_hash.slice(0, 32)}...
                  </div>
                </div>
                <div className="grid h-20 w-20 place-items-center rounded-md border border-[var(--line)] bg-[#f8faf7] text-[var(--teal)]">
                  <QrCode className="h-12 w-12" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <MetricTile icon={Database} label="Records Analysed" value={formatNumber(result?.metrics.casesAnalysed ?? snapshot.caseCount)} tone="bg-[var(--teal)]" />
            <MetricTile icon={Activity} label="May Theft Cases" value={formatNumber(snapshot.officialStats.may2026Theft)} tone="bg-[var(--saffron)]" />
            <MetricTile icon={LockKeyhole} label="Cyber 2024 Karnataka" value={formatNumber(snapshot.officialStats.cyber2024Karnataka)} tone="bg-[var(--indigo)]" />
          </div>
        </div>
      </Panel>
    </SectionShell>
  );
}

function auditText(value: unknown, fallback = "legacy") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function auditHash(log: Partial<AuditLog>) {
  return auditText(log.evidence_hash, auditText(log.output_hash, "legacy-audit-hash"));
}

function AuditTrail({ logs, refreshAuditLogs }: { logs: AuditLog[]; refreshAuditLogs: () => Promise<void> }) {
  return (
    <SectionShell>
      <Panel>
        <PanelTitle
          icon={Fingerprint}
          title="Immutable-Style Audit Trail"
          action={
            <button
              onClick={() => void refreshAuditLogs()}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm font-semibold hover:bg-[#f5f7f4]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          }
        />
        <div className="overflow-x-auto kavacha-scrollbar">
          <table className="w-full min-w-[1180px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[#f8faf7] text-left text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Intent</th>
                <th className="px-4 py-3">Query</th>
                <th className="px-4 py-3">Engines</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Evidence Hash</th>
                <th className="px-4 py-3">Officer Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.audit_id} className="border-b border-[var(--line)] align-top last:border-b-0">
                  <td className="px-4 py-3 font-semibold">{formatTime(auditText(log.timestamp, new Date().toISOString()))}</td>
                  <td className="px-4 py-3">{auditText(log.role)}</td>
                  <td className="px-4 py-3">{auditText(log.language, "English")}</td>
                  <td className="max-w-[240px] px-4 py-3 leading-5">{auditText(log.intent, "Legacy audit record")}</td>
                  <td className="max-w-[360px] px-4 py-3 leading-5">{auditText(log.query, "Legacy audit entry")}</td>
                  <td className="px-4 py-3">{Array.isArray(log.engines) ? log.engines.join(", ") : "ZCQL aggregate"}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--teal)]">
                    {Math.round((typeof log.confidence === "number" ? log.confidence : 0.8) * 100)}%
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{auditHash(log).slice(0, 18)}...</td>
                  <td className="px-4 py-3">{auditText(log.officer_action, "Human approval required")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </SectionShell>
  );
}

function TrustCenter({ snapshot, role }: { snapshot: DashboardSnapshot; role: RoleId }) {
  const currentRole = ROLES.find((item) => item.id === role) ?? ROLES[0];
  const [privacyMode, setPrivacyMode] = useState<"normal" | "authorised">("normal");

  return (
    <SectionShell>
      <Panel>
        <PanelTitle icon={LockKeyhole} title="Privacy Toggle" />
        <div className="grid gap-4 p-4 xl:grid-cols-[0.7fr_1.3fr]">
          <div className="flex gap-2 rounded-lg border border-[var(--line)] bg-[#f8faf7] p-2">
            {(["normal", "authorised"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPrivacyMode(mode)}
                className={cx(
                  "h-10 flex-1 rounded-md text-sm font-semibold capitalize",
                  privacyMode === mode ? "bg-[var(--ink)] text-white" : "bg-white text-[#34423d]"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-white p-4">
            <div className="text-sm font-semibold text-[var(--muted)]">
              {privacyMode === "normal" ? "Normal Mode" : "Authorised Mode"}
            </div>
            <p className="mt-2 text-sm leading-6 text-[#34423d]">
              {privacyMode === "normal"
                ? "All FIR, person, phone, bank, UPI, SIM, vehicle, and address fields remain masked by default."
                : "Elevated review still uses synthetic masked data in this prototype and requires a reason plus audit entry in deployment."}
            </p>
          </div>
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <PanelTitle icon={ShieldCheck} title="DPDP Governance" />
          <div className="space-y-3 p-4">
            {[
              ["Purpose limitation", "Crime intelligence for authorised police users"],
              ["Data minimisation", "Synthetic demo data and masked identifiers"],
              ["Access control", `${currentRole.label}: ${currentRole.scope}`],
              ["Human-in-loop", "Patrol recommendations require officer approval"],
              ["No profiling", "Area/time/category intelligence only"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[var(--line)] bg-white p-4">
                <div className="text-sm font-semibold text-[var(--muted)]">{label}</div>
                <div className="mt-1 text-base font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelTitle icon={CheckCircle2} title="Bias & Fairness Controls" />
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {snapshot.fairness.map((item) => (
              <div key={item.metric} className="rounded-lg border border-[var(--line)] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--muted)]">{item.metric}</div>
                  <span className={cx(
                    "rounded-full px-2 py-1 text-xs font-bold",
                    item.status === "pass" ? "bg-[#eef8f3] text-[var(--teal-ink)]" : "bg-[#fff4df] text-[#9a5b08]"
                  )}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-3 text-xl font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelTitle icon={FileText} title="Research & Source Register" />
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {RESEARCH_SOURCES.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-[var(--line)] bg-white p-4 text-sm font-semibold text-[var(--teal)] transition hover:border-[var(--teal)]"
            >
              {source.label}
            </a>
          ))}
        </div>
      </Panel>
      <Panel>
        <PanelTitle icon={Database} title="Admin Monitor" />
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile icon={Upload} label="CSV Validation" value="8 tables" tone="bg-[var(--teal)]" />
          <MetricTile icon={Radio} label="Last Ingestion" value="live" tone="bg-[var(--saffron)]" />
          <MetricTile icon={Activity} label="Model Status" value="QuickML-ready" tone="bg-[var(--indigo)]" />
          <MetricTile icon={Fingerprint} label="Audit Coverage" value="100%" tone="bg-[var(--vermillion)]" />
        </div>
      </Panel>
    </SectionShell>
  );
}
