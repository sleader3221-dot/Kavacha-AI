import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateRiskGrid } from "../src/lib/geo/generate-risk-grid";
import { generateSyntheticCasePoints, stationGeoJson } from "../src/lib/geo/generate-case-points";
import { patrolRouteGeoJson } from "../src/lib/geo/patrol-route-planner";

const dataDir = join(process.cwd(), "data", "generated");
const publicDir = join(process.cwd(), "public", "geo");
mkdirSync(dataDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

const generatedFiles = {
  "synthetic_case_points.geojson": generateSyntheticCasePoints(50000),
  "police_stations.geojson": stationGeoJson(),
  "risk_grid.geojson": generateRiskGrid(),
  "patrol_routes.geojson": patrolRouteGeoJson()
};

const publicFiles = {
  "synthetic_case_points.geojson": generateSyntheticCasePoints(600),
  "police_stations.geojson": stationGeoJson(),
  "risk_grid.geojson": generateRiskGrid(),
  "patrol_routes.geojson": patrolRouteGeoJson()
};

Object.entries(generatedFiles).forEach(([name, data]) => {
  const text = JSON.stringify(data, null, 2);
  writeFileSync(join(dataDir, name), text, "utf8");
});

Object.entries(publicFiles).forEach(([name, data]) => {
  const text = JSON.stringify(data, null, 2);
  writeFileSync(join(publicDir, name), text, "utf8");
});

console.log(`Generated GeoJSON in ${dataDir} and ${publicDir}`);
