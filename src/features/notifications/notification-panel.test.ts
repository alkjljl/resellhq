import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NotificationPanel } from "./notification-panel";
import type {
  ActivityPreferences,
  ResellNotification,
} from "./notification-model";

function renderOpenPanel({
  items,
  defaultPreferences,
}: {
  items?: readonly ResellNotification[];
  defaultPreferences?: ActivityPreferences;
} = {}) {
  return renderToStaticMarkup(
    createElement(NotificationPanel, {
      userId: "user-1",
      defaultOpen: true,
      items,
      defaultPreferences,
    }),
  );
}

const preferenceFixtures: ResellNotification[] = [
  {
    id: "read-update",
    kind: "system",
    title: "Read update",
    context: "Workspace",
    message: "A reviewed update.",
    timestamp: "Yesterday",
    read: true,
    isTask: false,
    isUpdate: true,
  },
  {
    id: "unread-task",
    kind: "price-review",
    title: "Unread task",
    context: "Inventory",
    message: "A task that still needs attention.",
    timestamp: "Just now",
    read: false,
    isTask: true,
    isUpdate: false,
  },
];

describe("Activity panel", () => {
  it("renders Activity terminology, controls, and the honest empty state", () => {
    const markup = renderOpenPanel();

    expect(markup).toContain('aria-label="Activity, no unread items"');
    expect(markup).toContain(">Activity<");
    expect(markup).toContain('aria-label="Activity filters"');
    expect(markup).toContain(">All<");
    expect(markup).toContain(">New<");
    expect(markup).toContain(">Tasks<");
    expect(markup).toContain(">Updates<");
    expect(markup).toContain("Mark all read");
    expect(markup).toContain("No activity yet");
    expect(markup).toContain(
      "Sales, listings, inventory and workspace updates will appear here.",
    );
  });

  it("renders status and an enabled Manage link in one footer row", () => {
    const markup = renderOpenPanel();

    expect(markup).toMatch(
      /<footer[^>]*>[\s\S]*Up to date[\s\S]*<\/footer>/,
    );
    expect(markup).toContain('href="/settings/preferences#activity"');
    expect(markup).toContain("items-center justify-between");
    expect(markup).toContain("min-h-11 shrink-0");
    expect(markup).toContain(">Manage<");
    expect(markup).not.toContain("min-h-11 w-full");
    expect(markup).not.toContain("aria-disabled");
  });

  it("uses the saved default view to select and filter the panel", () => {
    const markup = renderOpenPanel({
      items: preferenceFixtures,
      defaultPreferences: {
        defaultView: "tasks",
        showUnreadFirst: false,
      },
    });

    expect(markup).toMatch(/aria-selected="true"[^>]*>Tasks/);
    expect(markup).toContain("Unread task");
    expect(markup).not.toContain("Read update</h3>");
  });

  it("renders unread activity before read activity when requested", () => {
    const markup = renderOpenPanel({
      items: preferenceFixtures,
      defaultPreferences: {
        defaultView: "all",
        showUnreadFirst: true,
      },
    });

    expect(markup.indexOf("Unread task")).toBeLessThan(
      markup.indexOf("Read update"),
    );
  });
});
