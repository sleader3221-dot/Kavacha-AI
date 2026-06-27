# Deployment Guide

## Local Production Check

```bash
npm install
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
npm run start
```

## Environment

The local demo has no required secrets. Production adapters should use environment variables for:

```text
CATALYST_PROJECT_ID=
CATALYST_CLIENT_ID=
CATALYST_CLIENT_SECRET=
NEO4J_URI=
NEO4J_USER=
NEO4J_PASSWORD=
VECTOR_DB_URL=
BHASHINI_API_KEY=
TRANSLATION_PROVIDER=
TTS_PROVIDER=
```

## Zoho Catalyst Target

Recommended split:

- AppSail: Next.js frontend and route handlers
- Catalyst Functions: query router, GraphRAG orchestration, report generation
- Catalyst Data Store / ZCQL: operational app tables
- QuickML: approved hotspot scoring models
- File Store: generated PDF briefs and audit artifacts where policy permits

## Production Hardening

- Replace in-memory audit store with append-only database table
- Put API routes behind authenticated RBAC middleware
- Store only salted hashes for identifiers
- Add row-level district/station filtering
- Use signed report URLs with expiry
- Rate-limit copilot and export endpoints
- Add structured logging and alerting
- Add model drift checks before refreshing hotspot scores
- Run security review before connecting any real police dataset
- Keep Cytoscape layouts non-animated in React unless a separate lifecycle guard stops all active layouts before unmount
