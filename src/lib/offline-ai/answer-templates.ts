import type { Hotspot } from "@/lib/types";

export function offlineAnswerTemplate(hotspots: Hotspot[]) {
  const top = hotspots.slice(0, 3).map((item) => item.station).join(", ");
  return `Kavacha offline intelligence finds the strongest area/time/category signals at ${top}. This uses deterministic ZCQL-style aggregates, local hotspot scoring, local graph evidence, and a human approval workflow.`;
}
