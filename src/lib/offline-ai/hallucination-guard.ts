export function groundedAnswerGuard(answer: string, sourceCount: number) {
  const unsafeClaims = [/live KSP/i, /predict criminal/i, /individual risk/i];
  const blocked = unsafeClaims.filter((pattern) => pattern.test(answer)).map((pattern) => pattern.source);
  return {
    passed: blocked.length === 0 && sourceCount > 0,
    blocked,
    rule: "Answers must be source-grounded and must not claim live KSP feeds or individual criminal prediction."
  };
}
