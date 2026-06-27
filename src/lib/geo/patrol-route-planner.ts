import { BENGALURU_STATIONS } from "@/lib/catalog";
import type { GeoJsonFeatureCollection } from "./generate-case-points";

export function patrolRouteGeoJson(): GeoJsonFeatureCollection {
  const pairs = [
    ["Whitefield", "Koramangala"],
    ["Majestic", "KR Puram"],
    ["Koramangala", "Electronic City"]
  ];

  return {
    type: "FeatureCollection",
    features: pairs.map(([fromName, toName], index) => {
      const from = BENGALURU_STATIONS.find((station) => station.name === fromName) ?? BENGALURU_STATIONS[0];
      const to = BENGALURU_STATIONS.find((station) => station.name === toName) ?? BENGALURU_STATIONS[1];
      return {
        type: "Feature",
        properties: {
          route_id: `ROUTE-${index + 1}`,
          label: `${from.name} -> ${to.name}`,
          focus: from.leadCategories.join(" + "),
          coverage_estimate: 62 + index * 9,
          human_approval_required: true
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [from.lng, from.lat],
            [(from.lng + to.lng) / 2, (from.lat + to.lat) / 2 + 0.03],
            [to.lng, to.lat]
          ]
        }
      };
    })
  };
}
