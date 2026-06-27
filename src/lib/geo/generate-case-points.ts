import { getSyntheticData } from "@/lib/synthetic-data";
import { BENGALURU_STATIONS } from "@/lib/catalog";

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, string | number | boolean>;
    geometry: {
      type: "Point" | "Polygon" | "LineString";
      coordinates: unknown;
    };
  }>;
}

function offset(index: number, scale: number) {
  const angle = (index * 137.508 * Math.PI) / 180;
  const radius = scale * (0.4 + (index % 8) / 16);
  return {
    lng: Math.cos(angle) * radius,
    lat: Math.sin(angle) * radius
  };
}

export function generateSyntheticCasePoints(limit = 500): GeoJsonFeatureCollection {
  const data = getSyntheticData();
  const stationByName = new Map(BENGALURU_STATIONS.map((station) => [station.name, station]));
  const features = data.cases.slice(0, limit).map((item, index) => {
    const station = stationByName.get(item.station) ?? BENGALURU_STATIONS[index % BENGALURU_STATIONS.length];
    const jitter = offset(index, 0.006);
    return {
      type: "Feature" as const,
      properties: {
        case_id: item.case_id,
        fir_hash: item.fir_hash,
        crime_head: item.crime_head,
        station: item.station,
        beat: item.beat,
        severity: item.severity,
        confidence: Number((0.72 + (index % 20) / 100).toFixed(2)),
        masked: true
      },
      geometry: {
        type: "Point" as const,
        coordinates: [station.lng + jitter.lng, station.lat + jitter.lat]
      }
    };
  });

  return { type: "FeatureCollection", features };
}

export function stationGeoJson(): GeoJsonFeatureCollection {
  return {
    type: "FeatureCollection",
    features: BENGALURU_STATIONS.map((station) => ({
      type: "Feature",
      properties: {
        station_id: station.id,
        station_name: station.name,
        division: station.division,
        district: station.district,
        beat_code: station.beat,
        risk_score: Math.round(station.risk * 100),
        lead_categories: station.leadCategories.join(", "),
        patrol_window: station.patrolWindow
      },
      geometry: {
        type: "Point",
        coordinates: [station.lng, station.lat]
      }
    }))
  };
}
