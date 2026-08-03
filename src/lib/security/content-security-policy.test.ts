import { describe, expect, it } from "vitest";
import { createContentSecurityPolicy } from "./content-security-policy";

describe("createContentSecurityPolicy", () => {
  it("locks production pages to the application and required services", () => {
    const policy = createContentSecurityPolicy("production");

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("connect-src 'self' https://*.supabase.co");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toContain("localhost:*");
  });

  it("allows the local Supabase and Next development runtimes", () => {
    const policy = createContentSecurityPolicy("development");

    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("http://127.0.0.1:*");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });
});
