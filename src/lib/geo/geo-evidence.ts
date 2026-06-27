import { getSyntheticData } from "@/lib/synthetic-data";

export function geoEvidenceForStation(stationName: string) {
  const data = getSyntheticData();
  const hotspot = data.hotspots.find((item) => item.station === stationName) ?? data.hotspots[0];
  return {
    station: hotspot.station,
    beat: hotspot.beat,
    why: [
      `${hotspot.trendDelta}% month-over-month increase`,
      `${Math.round(hotspot.riskScore * 100)} area risk score`,
      `${hotspot.crimeHeads.join(" + ")} category concentration`,
      `Peak patrol window ${hotspot.patrolWindow}`,
      "Graph evidence and MO fingerprints require human review"
    ],
    confidence: hotspot.confidence,
    dataFreshness: "live synthetic stream, ready for authorised SCRB/CCTNS feed"
  };
}
