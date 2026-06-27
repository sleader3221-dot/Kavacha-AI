import { generateRiskGrid } from "./generate-risk-grid";
import { generateSyntheticCasePoints, stationGeoJson } from "./generate-case-points";
import { patrolRouteGeoJson } from "./patrol-route-planner";

export function allGeoLayers() {
  return {
    stations: stationGeoJson(),
    casePoints: generateSyntheticCasePoints(600),
    riskGrid: generateRiskGrid(),
    patrolRoutes: patrolRouteGeoJson()
  };
}
