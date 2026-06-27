# Synthetic Dataset Design

The local MVP generates deterministic synthetic SCRB/CCTNS-style records on the server. It does not contain real personal data.

## Implemented Scale

- 84,365 synthetic case records
- Full case exports can be generated locally with `npm run dataset:export`
- Local GeoJSON proof files can be generated with `npm run geo:generate`
- Lightweight deploy-safe GeoJSON previews are kept in `public/geo/`
- Five intelligence packs: theft, cyber fraud, NDPS, women/children safety, senior citizen safety
- Masked FIR, person, phone, bank, UPI, SIM, vehicle, and digital artifact identifiers
- Station and beat-level Bengaluru hotspot coordinates
- Seeded alert cards and live synthetic event stream
- Planted graph cluster for phone, bank, vehicle, station, and MO relationships
- MO fingerprint cards for fake courier scam, transit theft, and NDPS movement

## Production CSV Contract

Recommended CSV exports for Catalyst/Neo4j ingestion:

- `cases.csv`
- `persons.csv`
- `case_person_links.csv`
- `locations.csv`
- `evidence_links.csv`
- `modus_operandi.csv`
- `alerts.csv`
- `audit_logs.csv`

These generated files are intentionally ignored in Git to keep Zoho Slate/OpenNext deployment artifacts small. They are reproducible from the source generator.

## Hidden Pattern Strategy

Production seeding should intentionally plant 20-30 synthetic clusters:

- Same vehicle hash across theft cases
- Same phone hash across cyber cases
- Same bank or UPI hash across fraud cases
- Same MO tag across nearby stations
- Same time window across repeat-location incidents
- Same route-like geography for NDPS alerts

Every graph edge should carry:

- `strength`
- `reason`
- `last_seen`
- `evidence_points`

This turns the graph from decoration into explainable investigation intelligence.
