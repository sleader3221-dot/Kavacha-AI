import { describe, expect, it } from "vitest";
import { redactPii } from "./pii-redactor";

describe("redactPii", () => {
  it("masks common personal identifiers", () => {
    const redacted = redactPii("Call 9876543210, vehicle KA-01-AA-1234, email test@example.com");

    expect(redacted).toContain("PH-REDACTED");
    expect(redacted).toContain("VH-REDACTED");
    expect(redacted).toContain("EMAIL-REDACTED");
  });
});
