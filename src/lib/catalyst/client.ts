import { deploymentMode, getProviderStates } from "@/lib/config/providers";

export function catalystClientState() {
  return {
    configured: Boolean(process.env.CATALYST_PROJECT_ID),
    projectId: process.env.CATALYST_PROJECT_ID ?? "not-configured",
    environment: process.env.CATALYST_ENVIRONMENT ?? "local-demo",
    mode: deploymentMode(),
    providers: getProviderStates()
  };
}

export function requireCatalystConfigured() {
  const state = catalystClientState();
  if (!state.configured) {
    return {
      ok: false,
      reason: "Catalyst credentials are not configured. Running API-free synthetic demo mode."
    };
  }
  return { ok: true, reason: "Catalyst environment configured." };
}
