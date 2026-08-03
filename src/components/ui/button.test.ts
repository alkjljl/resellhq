import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";
import { buttonVariants } from "./button";

describe("responsive button visibility", () => {
  it("lets a responsive hidden utility replace the base display utility", () => {
    const className = cn(
      buttonVariants({ variant: "ghost", size: "sm" }),
      "hidden sm:inline-flex",
    );

    expect(className.split(/\s+/)).not.toContain("inline-flex");
    expect(className.split(/\s+/)).toContain("hidden");
    expect(className.split(/\s+/)).toContain("sm:inline-flex");
  });

  it("keeps every button variant at least 44 pixels tall", () => {
    for (const size of ["default", "sm", "lg", "icon"] as const) {
      const classes = buttonVariants({ size }).split(/\s+/);
      expect(classes.some((value) => value === "min-h-11")).toBe(true);
      expect(classes).not.toContain("h-9");
      expect(classes).not.toContain("size-10");
    }
  });
});
