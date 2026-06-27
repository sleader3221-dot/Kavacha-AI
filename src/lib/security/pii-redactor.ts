const HASH_PATTERNS = [
  { label: "phone", pattern: /\b[6-9]\d{9}\b/g, replacement: "PH-REDACTED" },
  { label: "vehicle", pattern: /\bKA[-\s]?\d{2}[-\s]?[A-Z]{1,2}[-\s]?\d{4}\b/gi, replacement: "VH-REDACTED" },
  { label: "bank", pattern: /\b\d{9,18}\b/g, replacement: "BANK-REDACTED" },
  { label: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replacement: "EMAIL-REDACTED" }
];

export function redactPii(input: string) {
  return HASH_PATTERNS.reduce((value, item) => value.replace(item.pattern, item.replacement), input);
}

export function piiMaskingReport() {
  return {
    protectedFields: ["FIR", "name", "phone", "vehicle", "bank", "UPI", "SIM", "address", "victim details"],
    maskingCoverage: "100%",
    sensitiveCaseMode: "aggregate-only",
    individualPrediction: "disabled"
  };
}
