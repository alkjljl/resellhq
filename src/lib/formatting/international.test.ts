import { describe, expect, it } from "vitest";
import { countryName, formatTimeZone, localeName } from "./international";

describe("international formatting", () => {
  it("formats canonical values for display without changing storage values", () => {
    expect(countryName("DE")).toBeTruthy();
    expect(localeName("en-GB")).toBeTruthy();
    expect(formatTimeZone("America/New_York")).toBe("America/New York");
  });
});
