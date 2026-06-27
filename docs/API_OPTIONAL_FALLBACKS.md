# Optional APIs And Fallbacks

| Capability | Optional Provider | Default Fallback |
| --- | --- | --- |
| LLM | OpenAI/Gemini/Groq | deterministic offline copilot |
| Kannada STT/translation | BHASHINI/IndicTrans2 | browser STT + local templates |
| Map tiles | MapTiler | OSM raster + local GeoJSON |
| Graph database | Neo4j | local POLE graph algorithms |
| ML scoring | QuickML | local weighted risk scorer |
| TTS | Sarvam/browser | browser speechSynthesis |

Every fallback is designed to keep the app demoable in secure or restricted-network environments.

