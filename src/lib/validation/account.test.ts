import { describe, expect, it } from "vitest";
import { onboardingSchema } from "./account";

const validOnboarding = {
  displayName: "Avery Chen",
  workspaceName: "Northline Resale",
  businessType: "Independent reseller",
  countryCode: "CA",
  defaultCurrency: "CAD",
  locale: "en-CA",
  timeZone: "America/Toronto",
};

describe("onboardingSchema", () => {
  it("accepts canonical international settings", () => {
    expect(onboardingSchema.safeParse(validOnboarding).success).toBe(true);
  });

  it("rejects invalid country, locale, and time-zone values", () => {
    const result = onboardingSchema.safeParse({
      ...validOnboarding,
      countryCode: "ZZ",
      locale: "not a locale",
      timeZone: "Somewhere/Unknown",
    });
    expect(result.success).toBe(false);
  });
});
