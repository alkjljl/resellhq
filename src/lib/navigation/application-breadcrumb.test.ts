import { describe, expect, it } from "vitest";
import { applicationBreadcrumb } from "./application-breadcrumb";

describe("applicationBreadcrumb", () => {
  it("labels the dashboard and settings pages from the current route", () => {
    expect(applicationBreadcrumb("/dashboard")).toEqual({
      section: "Overview",
      page: "Dashboard",
    });
    expect(applicationBreadcrumb("/settings/profile")).toEqual({
      section: "Settings",
      page: "Profile",
    });
    expect(applicationBreadcrumb("/settings/team")).toEqual({
      section: "Settings",
      page: "Team members",
    });
  });
});
