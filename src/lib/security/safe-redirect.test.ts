import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "./safe-redirect";

describe("getSafeRedirect", () => {
  it("allows only known internal application paths", () => {
    expect(getSafeRedirect("/settings/profile?updated=1")).toBe(
      "/settings/profile?updated=1",
    );
  });

  it.each([
    "https://attacker.example",
    "//attacker.example",
    "%2F%2Fattacker.example",
    "javascript:alert(1)",
    "/unknown",
    "/\\attacker.example",
  ])("rejects unsafe redirect %s", (value) => {
    expect(getSafeRedirect(value, "/login")).toBe("/login");
  });
});
