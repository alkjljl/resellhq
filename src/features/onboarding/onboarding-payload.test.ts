import { describe, expect, it } from "vitest";
import { onboardingSchema } from "@/lib/validation/account";
import {
  buildCompleteOnboardingArgs,
  decodeOnboardingFormData,
  toOnboardingFormData,
} from "./onboarding-payload";

const validOnboarding = {
  firstName: "Avery",
  lastName: "Chen",
  businessName: "Northline Resale",
  businessType: "Independent reseller",
  primaryCategory: "Clothing & accessories",
  countryCode: "CA",
  defaultCurrency: "CAD",
  sellingMarkets: ["CA", "US"],
  experienceLevel: "1-3 years",
  sellingChannels: ["eBay", "Vinted"],
  locale: "en-CA",
  timeZone: "America/Toronto",
  acceptedTerms: true,
};

describe("onboarding persistence payload", () => {
  it("keeps selling markets and selling channels separate arrays", () => {
    const decoded = decodeOnboardingFormData(
      toOnboardingFormData(onboardingSchema.parse(validOnboarding)),
    );

    expect(decoded.sellingMarkets).toEqual(["CA", "US"]);
    expect(decoded.sellingChannels).toEqual(["eBay", "Vinted"]);
  });

  it("includes every authoritative field without a client-supplied identity", () => {
    const args = buildCompleteOnboardingArgs(
      onboardingSchema.parse(validOnboarding),
    );

    expect(args).toEqual({
      p_first_name: "Avery",
      p_last_name: "Chen",
      p_business_name: "Northline Resale",
      p_business_type: "Independent reseller",
      p_primary_category: "Clothing & accessories",
      p_country_code: "CA",
      p_default_currency: "CAD",
      p_selling_markets: ["CA", "US"],
      p_experience_level: "1-3 years",
      p_selling_channels: ["eBay", "Vinted"],
      p_accepted_terms: true,
      p_locale: "en-CA",
      p_time_zone: "America/Toronto",
    });
    expect(Object.keys(args)).not.toContain("user_id");
  });

  it("persists an empty business name as null without a personal fallback", () => {
    const args = buildCompleteOnboardingArgs(
      onboardingSchema.parse({ ...validOnboarding, businessName: "   " }),
    );

    expect(args.p_business_name).toBeNull();
    expect(args.p_business_name).not.toBe("Avery Chen");
    expect(args.p_business_name).not.toBe("My workspace");
  });

  it("does not turn arbitrary truthy form values into consent", () => {
    const formData = toOnboardingFormData(
      onboardingSchema.parse(validOnboarding),
    );
    formData.set("acceptedTerms", "on");

    expect(
      onboardingSchema.safeParse(decodeOnboardingFormData(formData)).success,
    ).toBe(false);
  });
});
