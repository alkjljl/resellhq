import { describe, expect, it } from "vitest";
import {
  hasConsistentWorkspaceData,
  isAccountComplete,
  type CurrentAccount,
} from "./account-state";

function account(
  overrides: Partial<CurrentAccount> = {},
): CurrentAccount {
  return {
    user: { id: "user-1" } as CurrentAccount["user"],
    profile: {
      displayName: "Avery",
      themePreference: "system",
      onboardingCompleted: true,
      onboardingCompletedAt: "2026-07-27T10:00:00Z",
    },
    membership: { workspaceId: "workspace-1", role: "owner" },
    workspace: {
      id: "workspace-1",
      name: "Northline Resale",
      businessType: null,
      countryCode: "CA",
      defaultCurrency: "CAD",
      locale: "en-CA",
      timeZone: "America/Toronto",
    },
    ...overrides,
  };
}

describe("isAccountComplete", () => {
  it("treats a false onboarding flag as requiring onboarding", () => {
    expect(
      isAccountComplete(
        account({
          profile: {
            displayName: "Avery",
            themePreference: "system",
            onboardingCompleted: false,
            onboardingCompletedAt: null,
          },
        }),
      ),
    ).toBe(false);
  });

  it("treats a true onboarding flag as complete", () => {
    expect(isAccountComplete(account())).toBe(true);
  });

  it("does not reclassify a completed account when workspace data is missing", () => {
    const inconsistentAccount = account({
      membership: null,
      workspace: null,
    });

    expect(isAccountComplete(inconsistentAccount)).toBe(true);
    expect(hasConsistentWorkspaceData(inconsistentAccount)).toBe(false);
  });
});

describe("hasConsistentWorkspaceData", () => {
  it("requires an owner membership for the loaded workspace", () => {
    expect(hasConsistentWorkspaceData(account())).toBe(true);
    expect(
      hasConsistentWorkspaceData(
        account({
          membership: { workspaceId: "other-workspace", role: "owner" },
        }),
      ),
    ).toBe(false);
  });
});
