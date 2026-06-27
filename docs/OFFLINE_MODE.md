# API-Free Advanced Mode

Kavacha AI runs fully without paid AI or map APIs.

Default providers:

- `LLM_PROVIDER=local`
- `VOICE_PROVIDER=browser`
- `MAP_PROVIDER=local`
- `GRAPH_PROVIDER=local`
- `ML_PROVIDER=local`
- `NEXT_PUBLIC_DATA_MODE=synthetic`

What works locally:

- deterministic Kannada/Kanglish intent router
- generated ZCQL and Cypher
- local read-only query validation
- local POLE graph algorithms
- local risk scoring and anomaly detection
- MapLibre + OpenStreetMap raster + local GeoJSON
- synthetic real-time SCRB-style stream
- PDF mission brief with QR audit verification
- DPDP-aware Trust Center

Do not claim live KSP data. Use:

```text
real-time synthetic SCRB-style stream, ready for authorised SCRB/CCTNS feed
```

