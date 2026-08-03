import { describe, expect, it } from "vitest";
import { resolveRequestOrigin } from "./request-origin";

describe("resolveRequestOrigin", () => {
  it("uses the canonical configured origin in production", () => {
    expect(
      resolveRequestOrigin({
        configuredOrigin: "https://app.resellhq.example/path",
        environment: "production",
        forwardedHost: "attacker.example",
      }),
    ).toBe("https://app.resellhq.example");
  });

  it("rejects forwarded-host fallback outside development", () => {
    expect(() =>
      resolveRequestOrigin({
        environment: "production",
        forwardedHost: "attacker.example",
        protocol: "https",
      }),
    ).toThrow("NEXT_PUBLIC_APP_URL is required outside development.");
  });

  it("allows forwarded-host fallback only in development", () => {
    expect(
      resolveRequestOrigin({
        environment: "development",
        forwardedHost: "localhost:3000",
        protocol: "http",
      }),
    ).toBe("http://localhost:3000");
  });
});
