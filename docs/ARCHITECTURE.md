# Kavacha AI Architecture

## Product Loop

Kavacha AI is built around the operational loop:

```text
ASK -> ANALYSE -> EXPLAIN -> ACT
```

An authorised officer asks in Kannada or English. The system routes the question to the right engines, explains what it found, recommends beat-level action, exports a brief, and logs the full audit trail.

## Current Local Implementation

| Layer | Implementation |
| --- | --- |
| Frontend | Next.js App Router, React, Tailwind, lucide icons |
| API | Next.js route handlers |
| Realtime | Server-Sent Events at `/api/realtime` |
| Data | Deterministic synthetic CCTNS-style generator |
| Query router | Keyword and intent classifier for SQL, hotspot, graph, and report paths |
| Graph | Cytoscape.js POLE-style masked network with non-animated layout cleanup |
| Charts | Recharts |
| PDF | jsPDF 4.2.1 client-side export with QR audit code |
| Validation | Zod |
| Tests | Vitest |

## Production Target

| Layer | Target |
| --- | --- |
| Operational app data | Zoho Catalyst Data Store / ZCQL |
| Geospatial analytics | PostgreSQL + PostGIS if external DB is permitted; otherwise precomputed GeoJSON + Catalyst tables |
| Graph relationships | Neo4j POLE model |
| Semantic retrieval | pgvector or ChromaDB |
| Language pipeline | BHASHINI, AI4Bharat IndicTrans2, Whisper fallback, browser or approved Kannada TTS |
| ML | Catalyst QuickML or approved XGBoost/Isolation Forest runtime |
| Hosting | Zoho Catalyst AppSail + Functions |
| Security | RBAC, PII masking, audit hash, source citations, DPDP governance |

## Data Model

The local schema mirrors a CCTNS-style operational subset:

- `cases`: case id, FIR hash, date, district, station, crime head, section, severity, status
- `persons`: hashed person id, role, age band, gender, masked zone
- `case_person_links`: case/person relationship
- `locations`: latitude, longitude, district, beat, station
- `evidence_links`: vehicle hash, phone hash, bank hash, weapon type, digital artifact
- `modus_operandi`: pattern tags, time window, target type
- `alerts`: crime head, area, confidence, explanation
- `audit_logs`: user id, query, generated ZCQL, generated Cypher, timestamp, output hash

## Trust Controls

- No raw personal identifiers in the demo data
- No person-level criminal prediction
- Beat, station, time, and category-level risk only
- Role-scoped query output
- Every copilot response generates an audit row
- Sensitive categories remain aggregated
- Confidence and source labels are visible in the UI
- Generated ZCQL is checked by a read-only allow-list validator
- Graph edges include evidence strength, reason, last seen, and evidence points
- Mission briefs include evidence hashes and QR audit references
