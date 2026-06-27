# Catalyst Deployment

Datathon evaluation requires the deployed solution link to be on Zoho Catalyst.

This repo includes:

- `catalyst.json`
- AppSail-compatible Next.js build/start scripts
- Catalyst-ready environment variables
- Catalyst Data Store adapter layer
- ZCQL execution endpoint with synthetic fallback
- persistent audit adapter placeholder
- QuickML endpoint fallback layer

## Deploy Outline

```bash
npm ci
npm run build
catalyst deploy
```

Set these in Catalyst when available:

```text
CATALYST_PROJECT_ID=
CATALYST_ENVIRONMENT=
```

Kavacha still works without external AI keys. Catalyst deployment is the platform requirement; Gemini/OpenAI/MapTiler/Neo4j/BHASHINI/QuickML are optional production adapters.

