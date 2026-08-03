import { describe, expect, it } from "vitest";
import { hasRecoveryAssurance } from "./recovery-assurance";

describe("hasRecoveryAssurance", () => {
  it("accepts a verified recovery authentication method", () => {
    expect(
      hasRecoveryAssurance({
        amr: [{ method: "recovery", timestamp: 1_756_742_400 }],
      }),
    ).toBe(true);
  });

  it.each([
    undefined,
    {},
    { amr: [] },
    { amr: [{ method: "password" }] },
    { amr: [{ method: "token_refresh" }] },
    { amr: "recovery" },
  ])("rejects an ordinary or malformed session: %j", (claims) => {
    expect(hasRecoveryAssurance(claims)).toBe(false);
  });
});
