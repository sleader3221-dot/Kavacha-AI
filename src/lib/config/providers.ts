export type ProviderName = "data" | "llm" | "voice" | "map" | "graph" | "ml";

export interface ProviderState {
  name: ProviderName;
  active: string;
  fallback: string;
  status: "local" | "configured" | "missing";
  label: string;
}

function env(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

export function getProviderStates(): ProviderState[] {
  const states: ProviderState[] = [
    {
      name: "data",
      active: env("NEXT_PUBLIC_DATA_MODE", "synthetic"),
      fallback: "synthetic SCRB-style dataset",
      status: process.env.CATALYST_PROJECT_ID ? "configured" : "local",
      label: "Catalyst Data Store / local synthetic fallback"
    },
    {
      name: "llm",
      active: env("LLM_PROVIDER", "local"),
      fallback: "deterministic offline copilot",
      status: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY ? "configured" : "local",
      label: "Grounded summarizer"
    },
    {
      name: "voice",
      active: env("VOICE_PROVIDER", "browser"),
      fallback: "browser STT/TTS and Kannada templates",
      status: process.env.BHASHINI_API_KEY ? "configured" : "local",
      label: "Kannada voice pipeline"
    },
    {
      name: "map",
      active: env("MAP_PROVIDER", "local"),
      fallback: "MapLibre + local GeoJSON + OSM raster",
      status: process.env.MAPTILER_KEY ? "configured" : "local",
      label: "GeoOps map"
    },
    {
      name: "graph",
      active: env("GRAPH_PROVIDER", "local"),
      fallback: "local POLE graph algorithms",
      status: process.env.NEO4J_URI ? "configured" : "local",
      label: "GraphRAG engine"
    },
    {
      name: "ml",
      active: env("ML_PROVIDER", "local"),
      fallback: "local risk scoring and anomaly detection",
      status: process.env.QUICKML_ENDPOINT ? "configured" : "local",
      label: "QuickML / local model"
    }
  ];

  return states;
}

export function deploymentMode() {
  return {
    catalystReady: Boolean(process.env.CATALYST_PROJECT_ID || process.env.CATALYST_ENVIRONMENT),
    demoMode: env("NEXT_PUBLIC_ENABLE_DEMO_MODE", "true") === "true",
    syntheticStream: env("SYNTHETIC_STREAM_ENABLED", "true") === "true",
    streamIntervalMs: Number(env("SYNTHETIC_STREAM_INTERVAL_MS", "3500")),
    rbac: env("RBAC_ENFORCEMENT", "true") === "true",
    maskPii: env("MASK_PII_BY_DEFAULT", "true") === "true",
    sensitiveAggregateOnly: env("SENSITIVE_CASE_AGGREGATE_ONLY", "true") === "true"
  };
}
