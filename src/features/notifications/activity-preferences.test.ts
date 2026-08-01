import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActivityPreferencesSection } from "./activity-preferences";

describe("Activity preferences section", () => {
  it("renders the anchored device-local controls", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityPreferencesSection, { userId: "user-1" }),
    );

    expect(markup).toContain('id="activity"');
    expect(markup).toContain('tabindex="-1"');
    expect(markup).toContain(">Activity<");
    expect(markup).toContain("Default view");
    expect(markup).toContain('value="all" selected=""');
    expect(markup).toContain('role="switch"');
    expect(markup).toContain('aria-checked="false"');
    expect(markup).toContain("Show unread activity first");
    expect(markup).toContain("Saved on this device");
    expect(markup).toContain("stored separately for this");
    expect(markup).toContain("account in this browser");
  });
});
