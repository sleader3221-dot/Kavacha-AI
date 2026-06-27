import { NextResponse } from "next/server";
import { allGeoLayers } from "@/lib/geo/load-geojson";
import { catalystDatastoreHealth } from "@/lib/catalyst/datastore";
import { getProviderStates } from "@/lib/config/providers";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      mode: "real-time synthetic SCRB-style stream, ready for authorised SCRB/CCTNS feed",
      datastore: catalystDatastoreHealth(),
      providers: getProviderStates(),
      layers: allGeoLayers()
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
