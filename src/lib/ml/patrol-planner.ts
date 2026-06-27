import type { Hotspot, PatrolPlanItem } from "@/lib/types";

export function planPatrolRoutes(hotspots: Hotspot[]): PatrolPlanItem[] {
  return hotspots.slice(0, 4).map((hotspot, index) => ({
    dayRange: `Wave ${index + 1}`,
    area: `${hotspot.station} / ${hotspot.beat}`,
    window: hotspot.patrolWindow,
    focus: hotspot.crimeHeads.join(" + "),
    rationale: `Coverage-first route for ${hotspot.explanation} Human approval required.`
  }));
}
