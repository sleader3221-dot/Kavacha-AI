# Generated Dataset Outputs

This directory is intentionally kept out of the deployment artifact.

Run these commands locally when CSV or GeoJSON proof files are needed:

```bash
npm run dataset:export
npm run geo:generate
```

The application itself does not read these files at runtime. Kavacha generates deterministic synthetic SCRB-style data from `src/lib/synthetic-data.ts`, and the map APIs generate lightweight GeoJSON on demand.
