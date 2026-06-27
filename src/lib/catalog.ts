import type { CrimeHead, Role, Station } from "./types";

export const APP_NAME = "Kavacha AI";
export const APP_NAME_KANNADA = "ಕವಚ";

export const DEMO_QUERY_KANNADA =
  "ಮೇ 2026ರಲ್ಲಿ ಬೆಂಗಳೂರು ನಗರದಲ್ಲಿ ಕಳ್ಳತನ ಮತ್ತು ಸೈಬರ್ ಕ್ರೈಮ್ ಯಾವ ಪ್ರದೇಶಗಳಲ್ಲಿ ಹೆಚ್ಚಾಗಿದೆ? ಮುಂದಿನ 2 ವಾರಗಳ ಪೆಟ್ರೋಲಿಂಗ್ ಪ್ಲಾನ್ ಕೊಡಿ.";

export const DEMO_QUERY_ENGLISH =
  "In May 2026, where did theft and cybercrime increase in Bengaluru City? Give a 2-week patrol plan with sources and audit trail.";

export const ROLES: Role[] = [
  {
    id: "scrb_admin",
    label: "SCRB Admin",
    scope: "Statewide intelligence and governance",
    districtScope: ["All Karnataka"],
    canExport: true,
    canViewSensitive: true
  },
  {
    id: "sp",
    label: "SP",
    scope: "District command review",
    districtScope: ["Bengaluru City", "Mysuru", "Mangaluru", "Belagavi"],
    canExport: true,
    canViewSensitive: false
  },
  {
    id: "sho",
    label: "SHO",
    scope: "Station and beat-level action",
    districtScope: ["Bengaluru City"],
    canExport: true,
    canViewSensitive: false
  },
  {
    id: "analyst",
    label: "Analyst",
    scope: "Aggregate trends and model review",
    districtScope: ["All Karnataka"],
    canExport: false,
    canViewSensitive: false
  },
  {
    id: "demo_judge",
    label: "Demo Judge",
    scope: "Safe read-only demo mode",
    districtScope: ["Synthetic demo workspace"],
    canExport: true,
    canViewSensitive: false
  }
];

export const CRIME_HEADS: CrimeHead[] = [
  "Cyber fraud",
  "Theft",
  "Chain snatching",
  "NDPS",
  "POCSO",
  "Women safety",
  "Senior citizen safety",
  "Robbery",
  "Vehicle theft"
];

export const OFFICIAL_STATS = {
  may2026Cyber: 947,
  may2026Theft: 1740,
  may2026Ndps: 813,
  may2026Pocso: 406,
  cyber2024Karnataka: 21993,
  cyber2024Bengaluru: 17561
};

export const RESEARCH_SOURCES = [
  {
    label: "KSP Monthly Crime Review page",
    url: "https://ksp.karnataka.gov.in/new-page/Monthly%20Crime%20Review/en"
  },
  {
    label: "KSP Crime Review May 2026 PDF",
    url: "https://ksp.karnataka.gov.in/storage/pdf-files/2026%20%20PDFs/Crime%20Review%20May%202026.pdf"
  },
  {
    label: "Digital Personal Data Protection Act, 2023",
    url: "https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf"
  },
  {
    label: "BHASHINI",
    url: "https://bhashini.gov.in/"
  },
  {
    label: "AI4Bharat IndicTrans2",
    url: "https://github.com/AI4Bharat/IndicTrans2"
  },
  {
    label: "Zoho Catalyst Data Store",
    url: "https://docs.catalyst.zoho.com/en/cloud-scale/help/data-store/introduction/"
  },
  {
    label: "Zoho Catalyst QuickML",
    url: "https://docs.catalyst.zoho.com/en/quickml/"
  },
  {
    label: "K-GIS Downloads",
    url: "https://kgis.ksrsac.in/kgis/downloads.aspx"
  },
  {
    label: "OpenCity Karnataka crime datasets",
    url: "https://data.opencity.in/dataset/?q=ksp.karnataka.gov.in&tags=City+Services"
  }
];

export const DEMO_QUERIES = [
  {
    id: "dq-01",
    query: DEMO_QUERY_KANNADA,
    engine: "Kannada + SQL + map"
  },
  {
    id: "dq-02",
    query: "Show theft hotspots in Bengaluru for the last 30 days.",
    engine: "Heatmap"
  },
  {
    id: "dq-03",
    query: "Which police stations saw a sudden rise in NDPS cases?",
    engine: "Anomaly detection"
  },
  {
    id: "dq-04",
    query: "Find cases linked by same vehicle, phone hash, or modus operandi.",
    engine: "Neo4j GraphRAG"
  },
  {
    id: "dq-05",
    query: "Generate a 2-week patrol plan for high-risk zones.",
    engine: "ML + action card"
  },
  {
    id: "dq-06",
    query: "Which cyber fraud clusters need urgent attention?",
    engine: "Fraud network"
  },
  {
    id: "dq-07",
    query: "Compare POCSO trends month-over-month by district.",
    engine: "Sensitive dashboard"
  },
  {
    id: "dq-08",
    query: "Explain why this area is marked high risk.",
    engine: "Explainability"
  },
  {
    id: "dq-09",
    query: "Export this as an SP briefing PDF.",
    engine: "PDF generator"
  },
  {
    id: "dq-10",
    query: "Show audit trail for this query.",
    engine: "Trust layer"
  }
];

export const BENGALURU_STATIONS: Station[] = [
  {
    id: "blr-whitefield",
    name: "Whitefield",
    district: "Bengaluru City",
    division: "East",
    beat: "WFD-4",
    lat: 12.9698,
    lng: 77.7499,
    zone: "Tech corridor",
    risk: 0.91,
    trend: 18,
    patrolWindow: "19:00-23:30",
    leadCategories: ["Cyber fraud", "Vehicle theft"]
  },
  {
    id: "blr-majestic",
    name: "Majestic",
    district: "Bengaluru City",
    division: "Central",
    beat: "CEN-2",
    lat: 12.9767,
    lng: 77.5713,
    zone: "Transit hub",
    risk: 0.88,
    trend: 15,
    patrolWindow: "18:00-22:00",
    leadCategories: ["Theft", "Chain snatching"]
  },
  {
    id: "blr-koramangala",
    name: "Koramangala",
    district: "Bengaluru City",
    division: "South East",
    beat: "KRM-6",
    lat: 12.9352,
    lng: 77.6245,
    zone: "Commercial mixed use",
    risk: 0.84,
    trend: 13,
    patrolWindow: "20:00-00:30",
    leadCategories: ["Cyber fraud", "Theft"]
  },
  {
    id: "blr-indiranagar",
    name: "Indiranagar",
    district: "Bengaluru City",
    division: "East",
    beat: "IND-3",
    lat: 12.9784,
    lng: 77.6408,
    zone: "Night economy",
    risk: 0.8,
    trend: 11,
    patrolWindow: "19:30-23:30",
    leadCategories: ["Theft", "Women safety"]
  },
  {
    id: "blr-electronic-city",
    name: "Electronic City",
    district: "Bengaluru City",
    division: "South East",
    beat: "ELC-5",
    lat: 12.8452,
    lng: 77.6602,
    zone: "Industrial IT belt",
    risk: 0.78,
    trend: 10,
    patrolWindow: "17:30-21:30",
    leadCategories: ["Cyber fraud", "NDPS"]
  },
  {
    id: "blr-kr-puram",
    name: "KR Puram",
    district: "Bengaluru City",
    division: "East",
    beat: "KRP-2",
    lat: 13.0075,
    lng: 77.695,
    zone: "Rail and arterial road",
    risk: 0.76,
    trend: 9,
    patrolWindow: "06:30-09:30",
    leadCategories: ["Vehicle theft", "Theft"]
  },
  {
    id: "blr-yelahanka",
    name: "Yelahanka",
    district: "Bengaluru City",
    division: "North",
    beat: "YLK-1",
    lat: 13.1007,
    lng: 77.5963,
    zone: "Outer growth corridor",
    risk: 0.72,
    trend: 8,
    patrolWindow: "17:00-21:00",
    leadCategories: ["Senior citizen safety", "Theft"]
  },
  {
    id: "blr-jayanagar",
    name: "Jayanagar",
    district: "Bengaluru City",
    division: "South",
    beat: "JYN-4",
    lat: 12.925,
    lng: 77.5938,
    zone: "Residential market",
    risk: 0.69,
    trend: 7,
    patrolWindow: "16:30-20:30",
    leadCategories: ["Chain snatching", "Women safety"]
  },
  {
    id: "blr-banashankari",
    name: "Banashankari",
    district: "Bengaluru City",
    division: "South",
    beat: "BSK-3",
    lat: 12.9255,
    lng: 77.5468,
    zone: "Metro corridor",
    risk: 0.64,
    trend: 5,
    patrolWindow: "07:00-10:00",
    leadCategories: ["Theft", "Senior citizen safety"]
  },
  {
    id: "blr-hebbal",
    name: "Hebbal",
    district: "Bengaluru City",
    division: "North",
    beat: "HBL-2",
    lat: 13.0358,
    lng: 77.597,
    zone: "Airport approach",
    risk: 0.62,
    trend: 4,
    patrolWindow: "18:30-22:30",
    leadCategories: ["Vehicle theft", "NDPS"]
  }
];

export const DISTRICTS = [
  "Bengaluru City",
  "Mysuru",
  "Mangaluru",
  "Belagavi",
  "Kalaburagi",
  "Hubballi-Dharwad",
  "Shivamogga",
  "Tumakuru",
  "Udupi",
  "Ballari"
];

export const INTELLIGENCE_PACKS = [
  {
    title: "Cyber fraud",
    basis: "KSP May 2026 review records 947 cybercrime cases; public reporting places Karnataka cybercrime at 21,993 cases in 2024.",
    output: "Fraud hotspot map, mule-account style synthetic network, golden-hour alert"
  },
  {
    title: "Theft + chain snatching",
    basis: "KSP May 2026 review records 1,740 theft cases and robbery-linked chain-snatching categories.",
    output: "Patrol hotspot forecast and repeat-location detection"
  },
  {
    title: "NDPS / narcotics",
    basis: "KSP May 2026 review records 813 NDPS cases, far higher than May 2025's 374.",
    output: "Route and location trend detection"
  },
  {
    title: "Women + children safety",
    basis: "KSP May 2026 review includes crimes against women and 406 POCSO cases.",
    output: "Privacy-first sensitive-case dashboard"
  },
  {
    title: "Senior citizen safety",
    basis: "Public-safety priority suitable for beat-level intelligence without individual profiling.",
    output: "Vulnerable-zone alerts without profiling"
  }
];
