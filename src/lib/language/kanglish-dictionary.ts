export const KANGLISH_DICTIONARY: Record<string, string> = {
  alli: "in",
  jaasti: "increased high",
  jasthi: "increased high",
  yavudu: "which",
  yavaga: "when",
  kallatana: "theft",
  "kalla tana": "theft",
  aparadha: "crime",
  surakshate: "safety",
  mahile: "women",
  makkalu: "children",
  hiriyaru: "senior citizens",
  "madaka vastu": "narcotics",
  "cyber mosha": "cyber fraud",
  thane: "police station",
  thana: "police station",
  bengaluru: "bengaluru"
};

export function expandKanglishTerms(input: string) {
  return Object.entries(KANGLISH_DICTIONARY).reduce(
    (value, [source, target]) => value.replace(new RegExp(`\\b${source}\\b`, "gi"), target),
    input
  );
}
