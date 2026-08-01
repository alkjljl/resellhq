import { describe, expect, it } from "vitest";
import { businessSchema } from "@/lib/validation/account";
import { buildUpdateBusinessSettingsArgs } from "./business-payload";

describe("business settings payload", () => {
  const input = {
    workspaceName: "My workspace",
    businessName: "Northline Resale",
    businessType: "Independent reseller",
    countryCode: "CA",
  };

  it("adds and changes the business name on the authenticated account payload", () => {
    expect(
      buildUpdateBusinessSettingsArgs(businessSchema.parse(input))
        .p_business_name,
    ).toBe("Northline Resale");
    expect(
      buildUpdateBusinessSettingsArgs(
        businessSchema.parse({ ...input, businessName: "New name" }),
      ).p_business_name,
    ).toBe("New name");
  });

  it("persists removal as null and never accepts a workspace id", () => {
    const args = buildUpdateBusinessSettingsArgs(
      businessSchema.parse({ ...input, businessName: "   " }),
    );

    expect(args.p_business_name).toBeNull();
    expect(Object.keys(args)).not.toContain("workspace_id");
  });
});
