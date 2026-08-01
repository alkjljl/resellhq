import { describe, expect, it } from "vitest";
import { businessSchema, onboardingSchema } from "./account";

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

describe("onboardingSchema", () => {
  it("accepts every authoritative field and preserves channel arrays", () => {
    const result = onboardingSchema.parse(validOnboarding);

    expect(result.sellingMarkets).toEqual(["CA", "US"]);
    expect(result.sellingChannels).toEqual(["eBay", "Vinted"]);
    expect(result.acceptedTerms).toBe(true);
  });

  it.each([
    ["omitted", undefined],
    ["empty", ""],
    ["whitespace-only", "   "],
  ])("accepts an %s business name and normalizes it to null", (_label, value) => {
    const input = { ...validOnboarding } as Record<string, unknown>;
    if (value === undefined) delete input.businessName;
    else input.businessName = value;

    expect(onboardingSchema.parse(input).businessName).toBeNull();
  });

  it("trims and preserves a provided business name", () => {
    expect(
      onboardingSchema.parse({
        ...validOnboarding,
        businessName: "  Northline Resale  ",
      }).businessName,
    ).toBe("Northline Resale");
  });

  it.each([
    "firstName",
    "lastName",
    "businessType",
    "primaryCategory",
    "countryCode",
    "defaultCurrency",
    "sellingMarkets",
    "experienceLevel",
    "sellingChannels",
    "locale",
    "timeZone",
    "acceptedTerms",
  ])("rejects a missing required %s field", (field) => {
    const input = { ...validOnboarding } as Record<string, unknown>;
    delete input[field];
    expect(onboardingSchema.safeParse(input).success).toBe(false);
  });

  it.each([false, "true", "on", 1, {}, null])(
    "rejects acceptedTerms value %j",
    (acceptedTerms) => {
      expect(
        onboardingSchema.safeParse({
          ...validOnboarding,
          acceptedTerms,
        }).success,
      ).toBe(false);
    },
  );

  it("validates markets and channels independently", () => {
    expect(
      onboardingSchema.safeParse({
        ...validOnboarding,
        sellingMarkets: [],
        sellingChannels: ["eBay"],
      }).success,
    ).toBe(false);
    expect(
      onboardingSchema.safeParse({
        ...validOnboarding,
        sellingMarkets: ["CA"],
        sellingChannels: [],
      }).success,
    ).toBe(false);
  });

  it("rejects flattened selling-channel strings", () => {
    expect(
      onboardingSchema.safeParse({
        ...validOnboarding,
        sellingChannels: "eBay,Vinted",
      }).success,
    ).toBe(false);
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

describe("businessSchema", () => {
  const validBusiness = {
    workspaceName: "My workspace",
    businessName: "Northline Resale",
    businessType: "Independent reseller",
    countryCode: "CA",
  };

  it.each(["First name", "Second name"])(
    "allows a business name to be set to %s",
    (businessName) => {
      expect(
        businessSchema.parse({ ...validBusiness, businessName }).businessName,
      ).toBe(businessName);
    },
  );

  it.each(["", "   "])(
    "normalizes a cleared business name to null",
    (businessName) => {
      expect(
        businessSchema.parse({ ...validBusiness, businessName }).businessName,
      ).toBeNull();
    },
  );
});
