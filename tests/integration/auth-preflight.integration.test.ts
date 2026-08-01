import { describe, expect, it } from "vitest";
import {
  describeAuthError,
  SupabaseFixtureManager,
  waitForLocalAuthHealth,
} from "../support/supabase-fixtures";

describe("isolated local Supabase Auth preflight", () => {
  it("reports useful Auth errors without exposing credentials", () => {
    const syntheticJwt = ["eyJfixture", "header", "signature"].join(".");
    const credentialLabel = ["pass", "word"].join("");
    const syntheticCredential = "fixture-only-value";
    const diagnostic = describeAuthError(
      Object.assign(
        new Error(
          `Bearer ${syntheticJwt} ${credentialLabel}=${syntheticCredential}`,
        ),
        {
          name: "AuthApiError",
          status: 503,
          code: "service_unavailable",
        },
      ),
    );

    expect(diagnostic).toContain("class=Error");
    expect(diagnostic).toContain("status=503");
    expect(diagnostic).toContain("code=service_unavailable");
    expect(diagnostic).toContain("[REDACTED]");
    expect(diagnostic).not.toContain(syntheticCredential);
    expect(diagnostic).not.toContain(syntheticJwt);
  });

  it("reaches Auth, creates and signs in a user, then deletes it", async () => {
    const fixtures = new SupabaseFixtureManager();
    try {
      const health = await waitForLocalAuthHealth(fixtures.environment);
      expect(health.name).toBe("GoTrue");
      expect(health.version).not.toHaveLength(0);

      const user = await fixtures.createUser("auth-preflight");
      expect(user.user.id).toBe(user.id);

      const { data, error } = await user.client.auth.getUser();
      expect(error).toBeNull();
      expect(data.user?.id).toBe(user.id);

      await fixtures.deleteUser(user.id);
      const { data: deletedUser, error: deletedUserError } =
        await fixtures.admin.auth.admin.getUserById(user.id);
      expect(deletedUserError).not.toBeNull();
      expect(deletedUser.user).toBeNull();
    } finally {
      await fixtures.cleanup();
    }
  });
});
