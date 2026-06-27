import { addDays, format, parseISO } from "date-fns";
import {
  BENGALURU_STATIONS,
  CRIME_HEADS,
  DISTRICTS,
  OFFICIAL_STATS
} from "./catalog";
import { shortHash } from "./hash";
import type {
  Alert,
  CrimeCase,
  CrimeHead,
  DashboardSnapshot,
  EvidenceLink,
  Hotspot,
  ModusOperandi,
  NetworkGraph,
  MOFingerprint,
  Person,
  TrendPoint
} from "./types";

interface DataSet {
  cases: CrimeCase[];
  people: Person[];
  evidence: EvidenceLink[];
  modus: ModusOperandi[];
  trends: TrendPoint[];
  hotspots: Hotspot[];
  alerts: Alert[];
  graph: NetworkGraph;
  moFingerprints: MOFingerprint[];
}

let cached: DataSet | undefined;

const MONTHS = [
  "2025-01",
  "2025-02",
  "2025-03",
  "2025-04",
  "2025-05",
  "2025-06",
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05"
];

const SECTION_BY_HEAD: Record<CrimeHead, string> = {
  "Cyber fraud": "IT Act / BNS cheating provisions",
  Theft: "BNS theft provisions",
  "Chain snatching": "BNS robbery/theft provisions",
  NDPS: "NDPS Act",
  POCSO: "POCSO Act",
  "Women safety": "BNS women safety provisions",
  "Senior citizen safety": "BNS public safety provisions",
  Robbery: "BNS robbery provisions",
  "Vehicle theft": "BNS theft provisions"
};

const MO_BY_HEAD: Record<CrimeHead, string[]> = {
  "Cyber fraud": ["upi-fraud", "mule-account", "phishing-link", "remote-access"],
  Theft: ["transit-pickpocket", "market-distraction", "repeat-location"],
  "Chain snatching": ["two-wheeler-approach", "evening-market", "escape-route"],
  NDPS: ["parcel-route", "college-belt", "repeat-supplier"],
  POCSO: ["sensitive-case", "school-zone", "child-protection"],
  "Women safety": ["evening-transit", "public-place", "hotspot-repeat"],
  "Senior citizen safety": ["doorstep-fraud", "bank-visit-window", "isolated-street"],
  Robbery: ["night-economy", "weapon-threat", "transit-node"],
  "Vehicle theft": ["parking-lot", "duplicate-key", "two-wheeler"]
};

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 48271) % 2147483647;
    return value / 2147483647;
  };
}

function countForMonth(head: CrimeHead, monthIndex: number) {
  const trend = 1 + monthIndex * 0.035;
  const seasonal = 1 + Math.sin(monthIndex / 2.2) * 0.08;

  if (MONTHS[monthIndex] === "2026-05") {
    if (head === "Cyber fraud") return OFFICIAL_STATS.may2026Cyber;
    if (head === "Theft") return OFFICIAL_STATS.may2026Theft;
    if (head === "NDPS") return OFFICIAL_STATS.may2026Ndps;
    if (head === "POCSO") return OFFICIAL_STATS.may2026Pocso;
  }

  const base: Record<CrimeHead, number> = {
    "Cyber fraud": 560,
    Theft: 1120,
    "Chain snatching": 180,
    NDPS: 320,
    POCSO: 250,
    "Women safety": 430,
    "Senior citizen safety": 150,
    Robbery: 260,
    "Vehicle theft": 520
  };

  const ndpsSurge = head === "NDPS" && monthIndex > 12 ? 1.38 : 1;
  const cyberSurge = head === "Cyber fraud" && monthIndex > 11 ? 1.26 : 1;
  return Math.max(24, Math.round(base[head] * trend * seasonal * ndpsSurge * cyberSurge));
}

function pickStation(head: CrimeHead, rand: () => number) {
  const weighted = [...BENGALURU_STATIONS].sort((a, b) => {
    const aMatch = a.leadCategories.includes(head) ? 0.22 : 0;
    const bMatch = b.leadCategories.includes(head) ? 0.22 : 0;
    return b.risk + bMatch - (a.risk + aMatch);
  });
  const skew = Math.pow(rand(), 1.65);
  return weighted[Math.min(weighted.length - 1, Math.floor(skew * weighted.length))];
}

function severityFor(head: CrimeHead, rand: () => number): CrimeCase["severity"] {
  if (head === "POCSO" || head === "Women safety") return rand() > 0.74 ? "critical" : "high";
  if (head === "NDPS" || head === "Cyber fraud") return rand() > 0.7 ? "high" : "medium";
  if (rand() > 0.86) return "high";
  return rand() > 0.4 ? "medium" : "low";
}

function statusFor(rand: () => number): CrimeCase["status"] {
  const value = rand();
  if (value > 0.82) return "chargesheet";
  if (value > 0.64) return "closed";
  if (value > 0.14) return "investigation";
  return "registered";
}

function buildCases() {
  const rand = seededRandom(4272026);
  const cases: CrimeCase[] = [];
  const people: Person[] = [];
  const evidence: EvidenceLink[] = [];
  const modus: ModusOperandi[] = [];

  MONTHS.forEach((month, monthIndex) => {
    CRIME_HEADS.forEach((head) => {
      const count = countForMonth(head, monthIndex);
      for (let i = 0; i < count; i += 1) {
        const station = pickStation(head, rand);
        const day = Math.max(1, Math.min(28, Math.floor(rand() * 28) + 1));
        const date = `${month}-${String(day).padStart(2, "0")}`;
        const numericId = cases.length + 1;
        const caseId = `KA-${month.replace("-", "")}-${String(numericId).padStart(6, "0")}`;
        const caseHash = shortHash(`${caseId}-${head}-${station.id}`);

        cases.push({
          case_id: caseId,
          fir_hash: `FIR-${caseHash}`,
          date,
          district: rand() > 0.81 ? DISTRICTS[Math.floor(rand() * DISTRICTS.length)] : station.district,
          station: station.name,
          crime_head: head,
          section: SECTION_BY_HEAD[head],
          severity: severityFor(head, rand),
          status: statusFor(rand),
          location_id: `LOC-${station.id.toUpperCase()}`,
          beat: station.beat
        });

        if (numericId % 4 === 0) {
          people.push({
            person_hash: `PER-${shortHash(`${caseId}-person`)}`,
            role: rand() > 0.62 ? "accused" : "victim",
            age_band: ["18-25", "26-35", "36-50", "51-65", "65+"][
              Math.floor(rand() * 5)
            ] as Person["age_band"],
            gender: rand() > 0.52 ? "male" : rand() > 0.2 ? "female" : "undisclosed",
            masked_zone: `${station.zone} / ${station.beat}`
          });
        }

        if (numericId % 3 === 0) {
          evidence.push({
            case_id: caseId,
            phone_hash: `PH-${shortHash(`${caseId}-phone`, 10)}`,
            bank_hash: head === "Cyber fraud" ? `BK-${shortHash(`${caseId}-bank`, 10)}` : undefined,
            upi_hash: head === "Cyber fraud" ? `UPI-${shortHash(`${caseId}-upi`, 10)}` : undefined,
            sim_hash: head === "Cyber fraud" ? `SIM-${shortHash(`${caseId}-sim`, 10)}` : undefined,
            vehicle_hash:
              head === "Vehicle theft" || head === "Chain snatching"
                ? `VH-${shortHash(`${caseId}-vehicle`, 10)}`
                : undefined,
            weapon_type: head === "Robbery" ? "masked blunt object" : undefined,
            digital_artifact_hash: head === "Cyber fraud" ? `DA-${shortHash(`${caseId}-artifact`, 10)}` : undefined
          });
        }

        if (numericId % 2 === 0) {
          const tags = MO_BY_HEAD[head];
          modus.push({
            case_id: caseId,
            pattern_tags: tags.slice(0, 2 + Math.floor(rand() * Math.min(2, tags.length - 1))),
            time_window: station.patrolWindow,
            target_type:
              head === "Cyber fraud"
                ? "digital-payment-user"
                : head === "Senior citizen safety"
                  ? "senior-resident"
                  : "public-place",
            entry_method:
              head === "Cyber fraud"
                ? "message-link"
                : head === "Theft" || head === "Chain snatching"
                  ? "public-distraction"
                  : "field-intelligence",
            escape_method:
              head === "Cyber fraud"
                ? "wallet-transfer"
                : head === "Theft" || head === "Chain snatching"
                  ? "two-wheeler-route"
                  : "unknown",
            repeat_pattern_score: Number((0.52 + rand() * 0.44).toFixed(2))
          });
        }
      }
    });
  });

  return { cases, people, evidence, modus };
}

function buildTrends(cases: CrimeCase[]): TrendPoint[] {
  return MONTHS.slice(8).map((month) => {
    const monthCases = cases.filter((item) => item.date.startsWith(month));
    return {
      month: format(parseISO(`${month}-01`), "MMM yy"),
      cyber: monthCases.filter((item) => item.crime_head === "Cyber fraud").length,
      theft: monthCases.filter((item) => item.crime_head === "Theft").length,
      ndps: monthCases.filter((item) => item.crime_head === "NDPS").length,
      pocso: monthCases.filter((item) => item.crime_head === "POCSO").length,
      senior: monthCases.filter((item) => item.crime_head === "Senior citizen safety").length
    };
  });
}

function buildHotspots(): Hotspot[] {
  return BENGALURU_STATIONS.map((station, index) => ({
    stationId: station.id,
    station: station.name,
    district: station.district,
    beat: station.beat,
    lat: station.lat,
    lng: station.lng,
    crimeHeads: station.leadCategories,
    riskScore: Number(station.risk.toFixed(2)),
    confidence: Number((0.78 + station.risk * 0.17 - index * 0.006).toFixed(2)),
    trendDelta: station.trend,
    explanation: `${station.zone} shows repeat-location and time-window clustering for ${station.leadCategories.join(" + ")}.`,
    patrolWindow: station.patrolWindow
  })).sort((a, b) => b.riskScore - a.riskScore);
}

function buildAlerts(hotspots: Hotspot[]): Alert[] {
  const now = new Date();
  return hotspots.slice(0, 6).map((hotspot, index) => ({
    alert_id: `ALT-${String(index + 1).padStart(4, "0")}`,
    crime_head: hotspot.crimeHeads[0],
    area: `${hotspot.station} / ${hotspot.beat}`,
    confidence: hotspot.confidence,
    severity: index < 2 ? "urgent" : index < 4 ? "elevated" : "watch",
    explanation: hotspot.explanation,
    recommended_action:
      index < 2
        ? "Deploy evening foot patrol and cyber desk rapid-triage window."
        : "Increase beat visibility and review linked MO clusters before briefing.",
    updated_at: addDays(now, -index).toISOString()
  }));
}

function buildGraph(): NetworkGraph {
  return {
    summary:
      "Synthetic POLE graph links three cyber-fraud cases, two theft cases, shared phone identifiers, one vehicle hash, and repeat MO tags across Whitefield, Koramangala, and Majestic.",
    nodes: [
      { id: "case-cy-1042", label: "CY-1042", type: "case", risk: 0.91 },
      { id: "case-cy-1177", label: "CY-1177", type: "case", risk: 0.88 },
      { id: "case-th-8821", label: "TH-8821", type: "case", risk: 0.82 },
      { id: "case-th-9013", label: "TH-9013", type: "case", risk: 0.79 },
      { id: "per-a91f", label: "PER-A91F", type: "person", risk: 0.73 },
      { id: "phone-44c1", label: "PH-44C1", type: "phone", risk: 0.86 },
      { id: "bank-77ab", label: "BK-77AB", type: "bank", risk: 0.83 },
      { id: "veh-22fd", label: "VH-22FD", type: "vehicle", risk: 0.75 },
      { id: "mo-upi", label: "UPI mule MO", type: "mo", risk: 0.89 },
      { id: "mo-market", label: "Transit theft MO", type: "mo", risk: 0.76 },
      { id: "stn-whitefield", label: "Whitefield", type: "station" },
      { id: "stn-majestic", label: "Majestic", type: "station" },
      { id: "stn-koramangala", label: "Koramangala", type: "station" }
    ],
    edges: [
      graphEdge("e1", "case-cy-1042", "phone-44c1", "shared phone", 0.86, "same phone hash", [
        "PH-44C1 appears across two cyber-fraud cases",
        "Both incidents share evening reporting window",
        "Locations are within the East/South-East corridor"
      ]),
      graphEdge("e2", "case-cy-1177", "phone-44c1", "shared phone", 0.84, "same phone hash", [
        "Phone hash reused after first FIR",
        "Shared phishing-link artifact family"
      ]),
      graphEdge("e3", "case-cy-1042", "bank-77ab", "mule bank", 0.9, "same bank hash", [
        "BK-77AB receives masked UPI transfers",
        "Pattern matches fake courier scam cluster"
      ]),
      graphEdge("e4", "case-cy-1177", "bank-77ab", "mule bank", 0.88, "same bank hash", [
        "Bank hash repeats across complaints",
        "Transfers concentrated within 48 hours"
      ]),
      graphEdge("e5", "case-cy-1042", "mo-upi", "MO tag", 0.82, "same MO", [
        "Fake tracking link",
        "UPI collection request",
        "Remote support call"
      ]),
      graphEdge("e6", "case-cy-1177", "mo-upi", "MO tag", 0.8, "same MO", [
        "UPI refund language repeated",
        "Same complaint narrative fingerprint"
      ]),
      graphEdge("e7", "case-th-8821", "veh-22fd", "vehicle hash", 0.78, "same vehicle hash", [
        "VH-22FD seen in two theft cluster records",
        "Beat CCTV note marks matching two-wheeler color"
      ]),
      graphEdge("e8", "case-th-9013", "veh-22fd", "vehicle hash", 0.76, "same vehicle hash", [
        "Vehicle hash appears in adjacent station cluster",
        "Same 19:00-22:00 time window"
      ]),
      graphEdge("e9", "case-th-8821", "mo-market", "MO tag", 0.74, "same MO", [
        "Transit pickpocket pattern",
        "Market crowd distraction",
        "Repeat location within 2.3 km"
      ]),
      graphEdge("e10", "case-th-9013", "mo-market", "MO tag", 0.73, "same MO", [
        "Evening market window",
        "Same escape route pattern"
      ]),
      graphEdge("e11", "per-a91f", "phone-44c1", "subscriber link", 0.71, "subscriber association", [
        "Masked person hash linked to subscriber metadata",
        "Requires authorised review before any field action"
      ]),
      graphEdge("e12", "case-cy-1042", "stn-whitefield", "registered at", 0.68, "same station corridor", [
        "Whitefield tech corridor",
        "High cyber-fraud density beat"
      ]),
      graphEdge("e13", "case-cy-1177", "stn-koramangala", "registered at", 0.65, "same corridor", [
        "Koramangala mixed commercial zone",
        "Linked digital MO"
      ]),
      graphEdge("e14", "case-th-8821", "stn-majestic", "registered at", 0.7, "transit hub", [
        "Majestic transit node",
        "Repeat market theft MO"
      ]),
      graphEdge("e15", "case-th-9013", "stn-majestic", "registered at", 0.69, "transit hub", [
        "Same police station",
        "Same patrol window"
      ])
    ]
  };
}

function graphEdge(
  id: string,
  source: string,
  target: string,
  label: string,
  strength: number,
  reason: string,
  evidence_points: string[]
) {
  return {
    id,
    source,
    target,
    label,
    strength,
    reason,
    evidence_points,
    last_seen: "2026-05-27"
  };
}

function buildMOFingerprints(): MOFingerprint[] {
  return [
    {
      id: "MO-17",
      title: "Fake Courier Scam Cluster",
      commonPattern: "WhatsApp message, fake tracking link, UPI collection, and mule-account transfer.",
      linkedCases: 42,
      districts: ["Bengaluru Urban", "Mysuru", "Tumakuru"],
      confidence: 0.88,
      action: "Cyber desk golden-hour triage and mule-account freeze workflow."
    },
    {
      id: "MO-09",
      title: "Transit Market Theft Cluster",
      commonPattern: "Crowd distraction, two-wheeler escape, and repeat 19:00-22:00 market window.",
      linkedCases: 31,
      districts: ["Bengaluru Urban", "Belagavi"],
      confidence: 0.83,
      action: "Increase visible foot patrol and coordinate adjacent station watch."
    },
    {
      id: "MO-24",
      title: "Highway NDPS Movement",
      commonPattern: "Parcel movement near highway-like zones with repeated supplier route tags.",
      linkedCases: 26,
      districts: ["Mangaluru", "Udupi", "Bengaluru Urban"],
      confidence: 0.81,
      action: "Route-level intelligence briefing with human approval gate."
    }
  ];
}

export function getSyntheticData(): DataSet {
  if (cached) return cached;
  const { cases, people, evidence, modus } = buildCases();
  const hotspots = buildHotspots();
  cached = {
    cases,
    people,
    evidence,
    modus,
    trends: buildTrends(cases),
    hotspots,
    alerts: buildAlerts(hotspots),
    graph: buildGraph(),
    moFingerprints: buildMOFingerprints()
  };
  return cached;
}

export function getDashboardSnapshot(): DashboardSnapshot {
  const data = getSyntheticData();
  return {
    generatedAt: new Date().toISOString(),
    caseCount: data.cases.length,
    officialStats: OFFICIAL_STATS,
    trends: data.trends,
    hotspots: data.hotspots,
    alerts: data.alerts,
    graph: data.graph,
    moFingerprints: data.moFingerprints,
    fairness: [
      { metric: "PII exposure in officer answers", value: "0 raw identifiers", status: "pass" },
      { metric: "Sensitive-case aggregation", value: "Station/beat only", status: "pass" },
      { metric: "Category drift watch", value: "NDPS +41% vs baseline", status: "watch" },
      { metric: "Human approval gate", value: "Required for patrol action", status: "pass" }
    ]
  };
}
