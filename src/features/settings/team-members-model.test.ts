import { describe, expect, it } from "vitest";
import {
  formatLastActive,
  OWNER_ROLE_IS_PROTECTED,
  TEAM_MANAGEMENT_CAPABILITIES,
  TEAM_ROLES,
} from "./team-members-model";

describe("team member access model", () => {
  it("defines the requested initial roles as an unenforced access guide", () => {
    expect(TEAM_ROLES.map((role) => role.name)).toEqual([
      "Owner",
      "Admin",
      "Manager",
      "Staff",
      "Accountant",
    ]);
    expect(TEAM_ROLES.every((role) => role.access.startsWith("Intended"))).toBe(
      true,
    );
  });

  it("keeps unavailable team-management controls disabled", () => {
    expect(TEAM_MANAGEMENT_CAPABILITIES).toEqual({
      invitations: false,
      roleChanges: false,
      accessRemoval: false,
      ownershipTransfer: false,
    });
  });

  it("protects the Owner role from role or access changes", () => {
    expect(OWNER_ROLE_IS_PROTECTED).toBe(true);
  });
});

describe("formatLastActive", () => {
  it("returns an honest empty state when activity is unavailable", () => {
    expect(formatLastActive(undefined, "Europe/Berlin")).toEqual({
      at: null,
      label: "Activity unavailable",
    });
  });

  it("falls back safely when the workspace time zone is invalid", () => {
    const value = "2026-07-31T08:30:00Z";
    const result = formatLastActive(value, "Not/A_Time_Zone");

    expect(result.at).toBe(value);
    expect(result.label).toContain("2026");
  });
});
