import { cellToBoundary, latLngToCell } from "h3-js";
import { BENGALURU_STATIONS } from "@/lib/catalog";
import type { GeoJsonFeatureCollection } from "./generate-case-points";

export function generateRiskGrid(): GeoJsonFeatureCollection {
  const seen = new Set<string>();
  const features = BENGALURU_STATIONS.flatMap((station, index) => {
    const cells = [
      latLngToCell(station.lat, station.lng, 8),
      latLngToCell(station.lat + 0.01, station.lng + 0.01, 8)
    ];
    return cells.flatMap((cell, cellIndex) => {
      if (seen.has(cell)) return [];
      seen.add(cell);
      const boundary = cellToBoundary(cell, true);
      return [
        {
          type: "Feature" as const,
          properties: {
            h3: cell,
            station: station.name,
            beat: station.beat,
            risk_score: Math.min(98, Math.round(station.risk * 100) + cellIndex * 3),
            confidence: Number((0.78 + station.risk * 0.15).toFixed(2)),
            trend_delta: station.trend,
            patrol_window: station.patrolWindow,
            category: station.leadCategories[index % station.leadCategories.length] ?? station.leadCategories[0]
          },
          geometry: {
            type: "Polygon" as const,
            coordinates: [[...boundary, boundary[0]]]
          }
        }
      ];
    });
  });

  return { type: "FeatureCollection", features };
}
