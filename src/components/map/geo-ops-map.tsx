"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { BENGALURU_STATIONS } from "@/lib/catalog";
import { localMapStyle } from "@/lib/geo/map-style";
import type { Hotspot } from "@/lib/types";

interface GeoOpsMapProps {
  hotspots: Hotspot[];
  selectedStationId: string;
  setSelectedStationId: (stationId: string) => void;
  onModeChange?: (mode: "geoops" | "fallback") => void;
  liveEvent?: {
    stationId: string;
    station: string;
    beat: string;
    riskScore: number;
    timestamp: string;
  };
}

type LayersResponse = {
  mode: string;
  layers: {
    stations: GeoJSON.FeatureCollection;
    casePoints: GeoJSON.FeatureCollection;
    riskGrid: GeoJSON.FeatureCollection;
    patrolRoutes: GeoJSON.FeatureCollection;
  };
};

export function GeoOpsMap({ hotspots, selectedStationId, setSelectedStationId, onModeChange, liveEvent }: GeoOpsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [status, setStatus] = useState("Loading GeoOps layers");
  const [mode, setMode] = useState("real-time synthetic SCRB-style stream");
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let loadTimeout: ReturnType<typeof setTimeout> | undefined;

    async function boot() {
      setMapFailed(false);
      const response = await fetch("/api/map/layers", { cache: "no-store" });
      if (!response.ok) throw new Error(`Map layers failed with status ${response.status}`);
      const data = (await response.json()) as LayersResponse;
      if (cancelled || !containerRef.current) return;
      setMode(data.mode);

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: localMapStyle(),
        center: [77.64, 12.97],
        zoom: 10.2,
        attributionControl: false
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.on("error", () => {
        setStatus("Basemap degraded; GeoOps overlays active");
      });

      map.on("load", () => {
        if (loadTimeout) clearTimeout(loadTimeout);
        map.addSource("risk-grid", { type: "geojson", data: data.layers.riskGrid });
        map.addSource("case-points", { type: "geojson", data: data.layers.casePoints });
        map.addSource("stations", { type: "geojson", data: data.layers.stations });
        map.addSource("patrol-routes", { type: "geojson", data: data.layers.patrolRoutes });
        map.addSource("live-pulse", { type: "geojson", data: emptyPointCollection() });

        map.addLayer({
          id: "risk-grid-fill",
          type: "fill",
          source: "risk-grid",
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "risk_score"],
              45,
              "#0f766e",
              70,
              "#d97706",
              88,
              "#b44435"
            ],
            "fill-opacity": 0.28
          }
        });

        map.addLayer({
          id: "risk-grid-line",
          type: "line",
          source: "risk-grid",
          paint: { "line-color": "#ffffff", "line-width": 0.7, "line-opacity": 0.5 }
        });

        map.addLayer({
          id: "case-heat",
          type: "heatmap",
          source: "case-points",
          maxzoom: 14,
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "confidence"], 0.7, 0.2, 0.95, 1],
            "heatmap-intensity": 0.8,
            "heatmap-radius": 28,
            "heatmap-opacity": 0.65,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(15,118,110,0)",
              0.3,
              "#0f766e",
              0.62,
              "#d97706",
              1,
              "#b44435"
            ]
          }
        });

        map.addLayer({
          id: "patrol-routes",
          type: "line",
          source: "patrol-routes",
          paint: {
            "line-color": "#3730a3",
            "line-width": 4,
            "line-opacity": 0.75,
            "line-dasharray": [2, 1]
          }
        });

        map.addLayer({
          id: "stations",
          type: "circle",
          source: "stations",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["get", "risk_score"], 45, 7, 92, 15],
            "circle-color": ["case", [">", ["get", "risk_score"], 84], "#b44435", "#0f766e"],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2
          }
        });

        map.addLayer({
          id: "live-pulse-layer",
          type: "circle",
          source: "live-pulse",
          paint: {
            "circle-radius": 22,
            "circle-color": "#d97706",
            "circle-opacity": 0.24,
            "circle-stroke-color": "#d97706",
            "circle-stroke-width": 2
          }
        });

        map.on("click", "stations", (event) => {
          const stationId = event.features?.[0]?.properties?.station_id;
          if (typeof stationId === "string") setSelectedStationId(stationId);
        });

        setStatus("GeoOps map active");
        onModeChange?.("geoops");
      });

      loadTimeout = setTimeout(() => {
        if (map.loaded()) return;
        map.remove();
        mapRef.current = null;
        setMapFailed(true);
        setStatus("GeoOps fallback map active");
        onModeChange?.("fallback");
      }, 6000);
    }

    void boot().catch((error) => {
      setStatus(error instanceof Error ? error.message : "Map failed to load");
      setMapFailed(true);
      onModeChange?.("fallback");
    });

    return () => {
      cancelled = true;
      if (loadTimeout) clearTimeout(loadTimeout);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [onModeChange, setSelectedStationId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !liveEvent) return;
    const station = BENGALURU_STATIONS.find((item) => item.id === liveEvent.stationId);
    if (!station) return;
    const source = map.getSource("live-pulse") as maplibregl.GeoJSONSource | undefined;
    source?.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            station: station.name,
            beat: station.beat,
            risk_score: Math.round(liveEvent.riskScore * 100)
          },
          geometry: { type: "Point", coordinates: [station.lng, station.lat] }
        }
      ]
    });
  }, [liveEvent]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const station = BENGALURU_STATIONS.find((item) => item.id === selectedStationId);
    if (station) map.easeTo({ center: [station.lng, station.lat], zoom: 11.5, duration: 650 });
  }, [selectedStationId]);

  const selectedHotspot = hotspots.find((item) => item.stationId === selectedStationId) ?? hotspots[0];
  const bounds = { minLat: 12.82, maxLat: 13.13, minLng: 77.52, maxLng: 77.77 };
  const toPoint = (lat: number, lng: number) => ({
    x: ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100,
    y: 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100
  });

  if (mapFailed) {
    return (
      <div className="relative h-[560px] overflow-hidden rounded-lg border border-[var(--line)] bg-[#eef5f1]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,118,110,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(15,118,110,0.08)_1px,transparent_1px)] bg-[length:42px_42px]" />
        <div className="absolute left-4 top-4 max-w-[320px] rounded-md border border-[var(--line)] bg-white/95 px-3 py-2 text-sm shadow">
          <div className="font-semibold text-[var(--teal)]">Kavacha GeoOps Map</div>
          <div className="mt-1 text-xs font-semibold text-[#34423d]">{status}</div>
          <div className="mt-1 text-xs text-[var(--muted)]">{mode}</div>
        </div>
        {BENGALURU_STATIONS.map((station) => {
          const point = toPoint(station.lat, station.lng);
          const hotspot = hotspots.find((item) => item.stationId === station.id);
          const risk = hotspot?.riskScore ?? station.risk;
          const isSelected = selectedStationId === station.id;
          const isLive = liveEvent?.stationId === station.id;
          return (
            <button
              key={station.id}
              type="button"
              onClick={() => setSelectedStationId(station.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow transition hover:scale-110"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                width: isSelected ? 24 : isLive ? 22 : 16,
                height: isSelected ? 24 : isLive ? 22 : 16,
                backgroundColor: risk > 0.84 ? "#b44435" : risk > 0.72 ? "#d97706" : "#0f766e"
              }}
              title={`${station.name} / ${station.beat}`}
            />
          );
        })}
        {selectedHotspot && (
          <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-[var(--line)] bg-white/95 p-4 shadow md:left-auto md:w-[360px]">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Geo Evidence Lens</div>
            <div className="mt-2 text-lg font-semibold">{selectedHotspot.station} / {selectedHotspot.beat}</div>
            <div className="mt-1 text-sm font-semibold text-[var(--teal)]">
              {Math.round(selectedHotspot.riskScore * 100)} risk - {selectedHotspot.patrolWindow}
            </div>
            <ul className="mt-3 space-y-1 text-xs leading-5 text-[#34423d]">
              <li>+{selectedHotspot.trendDelta}% month-over-month signal</li>
              <li>{selectedHotspot.crimeHeads.join(" + ")} category concentration</li>
              <li>{Math.round(selectedHotspot.confidence * 100)}% confidence</li>
              <li>Human review required before action</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-[560px] overflow-hidden rounded-lg border border-[var(--line)] bg-[#eef5f1]">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute left-4 top-4 max-w-[320px] rounded-md border border-[var(--line)] bg-white/95 px-3 py-2 text-sm shadow">
        <div className="font-semibold text-[var(--teal)]">Kavacha GeoOps Map</div>
        <div className="mt-1 text-xs font-semibold text-[#34423d]">{status}</div>
        <div className="mt-1 text-xs text-[var(--muted)]">{mode}</div>
      </div>
      {selectedHotspot && (
        <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-[var(--line)] bg-white/95 p-4 shadow md:left-auto md:w-[360px]">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Geo Evidence Lens</div>
          <div className="mt-2 text-lg font-semibold">{selectedHotspot.station} / {selectedHotspot.beat}</div>
          <div className="mt-1 text-sm font-semibold text-[var(--teal)]">
            {Math.round(selectedHotspot.riskScore * 100)} risk · {selectedHotspot.patrolWindow}
          </div>
          <ul className="mt-3 space-y-1 text-xs leading-5 text-[#34423d]">
            <li>+{selectedHotspot.trendDelta}% month-over-month signal</li>
            <li>{selectedHotspot.crimeHeads.join(" + ")} category concentration</li>
            <li>{Math.round(selectedHotspot.confidence * 100)}% confidence</li>
            <li>Human review required before action</li>
          </ul>
        </div>
      )}
    </div>
  );
}

function emptyPointCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}
