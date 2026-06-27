import { NextResponse } from "next/server";
import { BENGALURU_STATIONS } from "@/lib/catalog";
import { getSyntheticData } from "@/lib/synthetic-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = getSyntheticData();
  const sequence = Math.floor(Date.now() / 3500);
  const station = BENGALURU_STATIONS[sequence % BENGALURU_STATIONS.length];
  const alert = data.alerts[sequence % data.alerts.length];

  return NextResponse.json(
    {
      sequence,
      timestamp: new Date().toISOString(),
      stationId: station.id,
      station: station.name,
      beat: station.beat,
      signal:
        sequence % 3 === 0
          ? "Synthetic case ingest committed"
          : sequence % 3 === 1
            ? "Hotspot confidence recalculated"
            : "Audit-safe alert refreshed",
      riskScore: Number(Math.min(0.96, station.risk + (sequence % 5) * 0.01).toFixed(2)),
      alert
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
