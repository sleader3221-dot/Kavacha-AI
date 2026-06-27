# Research Notes

## Strategic Decision

The project is locked as:

```text
Kavacha AI (ಕವಚ)
Kannada-first Crime Intelligence Copilot for Karnataka State Police
Challenge 01: Intelligent Conversational AI for KSP Crime Database
```

The product should feel like an operational intelligence loop rather than a generic crime dashboard.

## Official Crime Review Basis

The Karnataka State Police Monthly Crime Review page lists monthly PDF reviews, including the May 2026 review. The local product uses the public May 2026 figures highlighted in the brief:

- Cybercrime: 947 cases
- Theft: 1,740 cases
- NDPS: 813 cases
- POCSO: 406 cases

These are surfaced as source-backed metrics in the command center and copilot response.

## Five Intelligence Packs

| Pack | Why It Matters | Demo Output |
| --- | --- | --- |
| Cyber fraud | High public-safety and operational value | Fraud hotspot map, mule-account style synthetic graph |
| Theft + chain snatching | Patrol-relevant recurring crime category | Repeat-location detection and beat windows |
| NDPS | Route and location intelligence | Trend and anomaly alert cards |
| Women + children safety | Sensitive category requiring privacy-first design | Aggregated sensitive-case dashboard |
| Senior citizen safety | Public safety category suitable for beat-level action | Vulnerable-zone alert without profiling |

## Language Stack

Kavacha positions Kannada as a first-class workflow:

- BHASHINI for Government of India language-platform alignment
- AI4Bharat IndicTrans2 for Indic translation positioning
- Whisper or browser speech recognition fallback for speech-to-text
- Browser speech synthesis or approved provider for Kannada TTS
- Transliteration-aware query handling in the future production adapter

## Ethics

The system avoids risky wording and design:

- No criminal profiling
- No prediction of individuals
- No automated policing
- No unmasked identifiers
- No final action without a human officer

Preferred framing:

- Area/time/category risk intelligence
- Early-warning hotspot detection
- Human-in-the-loop decision support
- Modus operandi pattern analysis
- Repeat-offender linkage score

## Sources

- [KSP Monthly Crime Review page](https://ksp.karnataka.gov.in/new-page/Monthly%20Crime%20Review/en)
- [KSP Crime Review May 2026 PDF](https://ksp.karnataka.gov.in/storage/pdf-files/2026%20%20PDFs/Crime%20Review%20May%202026.pdf)
- [Digital Personal Data Protection Act, 2023](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf)
- [BHASHINI](https://bhashini.gov.in/)
- [AI4Bharat IndicTrans2](https://github.com/AI4Bharat/IndicTrans2)
- [Zoho Catalyst Data Store](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-store/introduction/)
- [Zoho Catalyst QuickML](https://docs.catalyst.zoho.com/en/quickml/)
- [K-GIS Downloads](https://kgis.ksrsac.in/kgis/downloads.aspx)
- [OpenCity Karnataka datasets](https://data.opencity.in/dataset/?q=ksp.karnataka.gov.in&tags=City+Services)

## Implemented Top-1 Differentiators

- Kannada officer query -> SQL + GraphRAG + hotspot scorer -> patrol plan -> PDF -> audit trail
- Ten demo query presets with engine labels
- Kanglish transliteration dictionary for common field terms
- Query validator that displays read-only ZCQL safety status
- Graph Evidence Strength on every graph edge
- MO fingerprint cards for planted synthetic clusters
- What-if patrol coverage simulator with safe wording
- Human approval workflow for alert cards
- Privacy toggle and DPDP-aware Trust Center
- Mission brief QR audit artifact
