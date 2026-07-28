import { describe, expect, it } from "vitest";
import {
  canOpenOnboarding,
  destinationForAccount,
  isProtectedPath,
  type AccountState,
} from "./routing";

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
});
