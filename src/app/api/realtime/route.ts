import { BENGALURU_STATIONS } from "@/lib/catalog";
import { getSyntheticData } from "@/lib/synthetic-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function eventPayload(sequence: number) {
  const data = getSyntheticData();
  const station = BENGALURU_STATIONS[sequence % BENGALURU_STATIONS.length];
  const alert = data.alerts[sequence % data.alerts.length];

  return {
    sequence,
    timestamp: new Date().toISOString(),
    stationId: station.id,
    station: station.name,
    beat: station.beat,
    signal:
      sequence % 3 === 0
        ? "CCTNS synthetic ingest committed"
        : sequence % 3 === 1
          ? "Hotspot confidence recalculated"
          : "Audit-safe alert refreshed",
    riskScore: Number(Math.min(0.96, station.risk + (sequence % 5) * 0.01).toFixed(2)),
    alert
  };
}

export async function GET() {
  let timer: ReturnType<typeof setInterval> | undefined;
  let sequence = 0;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: ready\ndata: ${JSON.stringify(eventPayload(sequence))}\n\n`));
      timer = setInterval(() => {
        sequence += 1;
        controller.enqueue(encoder.encode(`event: update\ndata: ${JSON.stringify(eventPayload(sequence))}\n\n`));
      }, 3500);
    },
    cancel() {
      if (timer) clearInterval(timer);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
