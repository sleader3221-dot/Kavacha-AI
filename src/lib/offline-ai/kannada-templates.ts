import type { Hotspot } from "@/lib/types";

export function kannadaOfficerSummary(hotspots: Hotspot[]) {
  const top = hotspots.slice(0, 3).map((item) => item.station).join(", ");
  return `ಪ್ರಮುಖ ಗಮನ ಪ್ರದೇಶಗಳು: ${top}. ಇದು ಸ್ಥಳ/ಸಮಯ/ವರ್ಗ ಮಟ್ಟದ ಗುಪ್ತಚರ ಮಾತ್ರ; ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲಿಂಗ್ ಇಲ್ಲ.`;
}
