import { describe, expect, it } from "vitest";
// @ts-expect-error The acceptance helper is intentionally executable JavaScript.
import * as testEnvironmentHelpers from "../../../scripts/acceptance/test-environment.mjs";

const {
  capturePlaywrightTestEnvironment,
  sanitizeApplicationEnvironment,
} = testEnvironmentHelpers;

const secretKey = "local-test-secret";

function isolatedEnvironment(overrides: Record<string, string> = {}) {
  return {
    PHASE1_TEST_SUPABASE_TARGET: "local",
    PHASE1_TEST_SUPABASE_URL: "http://127.0.0.1:54321",
    PHASE1_TEST_SUPABASE_PUBLISHABLE_KEY: "local-publishable-key",
    PHASE1_TEST_SUPABASE_SECRET_KEY: secretKey,
    PHASE1_TEST_SUPABASE_PROJECT_REF: "resellhq",
    PHASE1_TEST_ISOLATED_CONFIRMATION: "I_CONFIRM_ISOLATED_resellhq",
    ...overrides,
  };
}

describe("Playwright test-environment lifecycle", () => {
  it("preserves the coordinator credential across repeated discovery loads", () => {
    const coordinatorEnvironment = isolatedEnvironment();

    expect(
      capturePlaywrightTestEnvironment(coordinatorEnvironment).secretKey,
    ).toBe(secretKey);
    expect(
      capturePlaywrightTestEnvironment(coordinatorEnvironment).secretKey,
    ).toBe(secretKey);
    expect(coordinatorEnvironment.PHASE1_TEST_SUPABASE_SECRET_KEY).toBe(
      secretKey,
    );
  });

  it("lets independent workers capture and remove only their inherited copy", () => {
    const coordinatorEnvironment = isolatedEnvironment();

    for (const workerIndex of ["0", "1"]) {
      const workerEnvironment = {
        ...coordinatorEnvironment,
        TEST_WORKER_INDEX: workerIndex,
        TEST_PARALLEL_INDEX: "0",
      };

      expect(capturePlaywrightTestEnvironment(workerEnvironment).secretKey).toBe(
        secretKey,
      );
      expect(workerEnvironment.PHASE1_TEST_SUPABASE_SECRET_KEY).toBeUndefined();
    }

    expect(coordinatorEnvironment.PHASE1_TEST_SUPABASE_SECRET_KEY).toBe(
      secretKey,
    );
  });

  it("removes privileged values from the application-process environment", () => {
    const source = isolatedEnvironment({
      SUPABASE_SERVICE_ROLE_KEY: "service-role-value",
      UNRELATED_ACCESS_TOKEN: "access-token-value",
      SAFE_VALUE: "preserved",
    });

    const sanitized = sanitizeApplicationEnvironment(source);

    expect(sanitized.PHASE1_TEST_SUPABASE_SECRET_KEY).toBeUndefined();
    expect(sanitized.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(sanitized.UNRELATED_ACCESS_TOKEN).toBeUndefined();
    expect(sanitized.PHASE1_TEST_SUPABASE_PUBLISHABLE_KEY).toBe(
      "local-publishable-key",
    );
    expect(sanitized.SAFE_VALUE).toBe("preserved");
    expect(source.PHASE1_TEST_SUPABASE_SECRET_KEY).toBe(secretKey);
  });
});
