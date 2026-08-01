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
      firstName: "Avery",
      lastName: "Chen",
      businessName: null,
      themePreference: "system",
      acceptedTerms: true,
      completedOnboarding: "2026-07-27T10:00:00Z",
      onboardingCompleted: true,
      onboardingCompletedAt: "2026-07-27T10:00:00Z",
    },
    membership: { workspaceId: "workspace-1", role: "owner" },
    workspace: {
      id: "workspace-1",
      name: "Northline Resale",
      businessType: null,
      primaryCategory: null,
      sellingMarkets: null,
      experienceLevel: null,
      sellingChannels: null,
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
            firstName: "",
            lastName: "",
            businessName: null,
            themePreference: "system",
            acceptedTerms: null,
            completedOnboarding: null,
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

  it("uses the canonical completion timestamp for new completions", () => {
    expect(
      isAccountComplete(
        account({
          profile: {
            ...account().profile!,
            completedOnboarding: "2026-07-31T10:00:00Z",
            onboardingCompleted: false,
          },
        }),
      ),
    ).toBe(true);
  });

  it("keeps a legacy completed user complete without fabricating consent", () => {
    expect(
      isAccountComplete(
        account({
          profile: {
            ...account().profile!,
            acceptedTerms: null,
            completedOnboarding: null,
            onboardingCompleted: true,
          },
        }),
      ),
    ).toBe(true);
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
