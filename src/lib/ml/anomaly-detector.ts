import type { Alert, Hotspot } from "@/lib/types";

export function detectAnomalies(hotspots: Hotspot[]): Alert[] {
  return hotspots
    .filter((hotspot) => hotspot.trendDelta >= 8)
    .slice(0, 8)
    .map((hotspot, index) => ({
      alert_id: `ANOM-${String(index + 1).padStart(4, "0")}`,
      crime_head: hotspot.crimeHeads[0],
      area: `${hotspot.station} / ${hotspot.beat}`,
      confidence: hotspot.confidence,
      severity: hotspot.trendDelta >= 15 ? "urgent" : "elevated",
      explanation: `${hotspot.station} is ${hotspot.trendDelta}% above the local synthetic baseline.`,
      recommended_action: "Review hotspot evidence and approve patrol coverage if operationally justified.",
      updated_at: new Date().toISOString()
    }));
}
