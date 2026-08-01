import { describe, expect, it } from "vitest";
import {
  accountStateForAccount,
  canOpenOnboarding,
  destinationAfterSignIn,
  destinationForAccount,
  isProtectedPath,
  resolveRootDestination,
  type AccountState,
} from "./routing";
import type { CurrentAccount } from "./account-state";

function account(onboardingCompleted: boolean): CurrentAccount {
  return {
    user: { id: "user-1" } as CurrentAccount["user"],
    profile: {
      displayName: "Avery",
      firstName: "Avery",
      lastName: "Chen",
      businessName: null,
      themePreference: "system",
      acceptedTerms: onboardingCompleted ? true : null,
      completedOnboarding: onboardingCompleted
        ? "2026-07-31T08:30:00Z"
        : null,
      onboardingCompleted,
      onboardingCompletedAt: onboardingCompleted
        ? "2026-07-31T08:30:00Z"
        : null,
    },
    membership: onboardingCompleted
      ? { workspaceId: "workspace-1", role: "owner" }
      : null,
    workspace: onboardingCompleted
      ? {
          id: "workspace-1",
          name: "Northline Resale",
          businessType: null,
          primaryCategory: null,
          sellingMarkets: null,
          experienceLevel: null,
          sellingChannels: null,
          countryCode: "DE",
          defaultCurrency: "EUR",
          locale: "de-DE",
          timeZone: "Europe/Berlin",
        }
      : null,
  };
}

describe("authentication routing", () => {
  const cases: Array<[AccountState, string]> = [
    ["unauthenticated", "/login"],
    ["needs-onboarding", "/onboarding"],
    ["complete", "/dashboard"],
  ];

  it.each(cases)("routes %s accounts to %s", (state, destination) => {
    expect(destinationForAccount(state)).toBe(destination);
  });

  it("only permits incomplete authenticated accounts into onboarding", () => {
    expect(canOpenOnboarding("needs-onboarding")).toBe(true);
    expect(canOpenOnboarding("complete")).toBe(false);
    expect(canOpenOnboarding("unauthenticated")).toBe(false);
  });

  it("derives routing state from the canonical onboarding flag", () => {
    expect(accountStateForAccount(null)).toBe("unauthenticated");
    expect(accountStateForAccount(account(false))).toBe("needs-onboarding");
    expect(accountStateForAccount(account(true))).toBe("complete");
  });

  it("honors safe return paths only after onboarding is complete", () => {
    expect(
      destinationAfterSignIn(account(true), "/settings/preferences#activity"),
    ).toBe("/settings/preferences#activity");
    expect(
      destinationAfterSignIn(account(false), "/settings/preferences#activity"),
    ).toBe("/onboarding");
    expect(
      destinationAfterSignIn(account(true), "https://attacker.example"),
    ).toBe("/dashboard");
  });
});

describe("protected authentication routes", () => {
  it.each([
    "/dashboard",
    "/dashboard/activity",
    "/settings",
    "/settings/security",
    "/onboarding",
  ])("requires authentication for %s", (pathname) => {
    expect(isProtectedPath(pathname)).toBe(true);
  });

  it.each(["/", "/login", "/signup", "/forgot-password"])(
    "leaves %s publicly accessible",
    (pathname) => {
      expect(isProtectedPath(pathname)).toBe(false);
    },
  );

  it("terminates signed-out navigation at login without a redirect loop", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(destinationForAccount("unauthenticated")).toBe("/login");
    expect(isProtectedPath("/login")).toBe(false);
  });
});

describe("root authentication routing", () => {
  it("renders the landing page for a signed-out visitor", async () => {
    await expect(resolveRootDestination(async () => null)).resolves.toBeNull();
  });

  it("redirects an authenticated onboarded visitor to the dashboard", async () => {
    await expect(
      resolveRootDestination(async () => account(true)),
    ).resolves.toBe("/dashboard");
  });

  it("redirects an authenticated incomplete visitor to onboarding", async () => {
    await expect(
      resolveRootDestination(async () => account(false)),
    ).resolves.toBe("/onboarding");
  });

  it("renders the landing page when the authentication lookup fails", async () => {
    await expect(
      resolveRootDestination(async () => {
        throw new Error("Auth service unavailable");
      }),
    ).resolves.toBeNull();
  });

  it("never redirects the root route back to itself", async () => {
    const destinations = await Promise.all([
      resolveRootDestination(async () => account(true)),
      resolveRootDestination(async () => account(false)),
      resolveRootDestination(async () => null),
    ]);

    expect(destinations).toEqual(["/dashboard", "/onboarding", null]);
    expect(destinations).not.toContain("/");
  });
});
