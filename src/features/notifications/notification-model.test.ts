import { describe, expect, it, vi } from "vitest";
import {
  activityPreferencesStorageKey,
  countNotifications,
  DEFAULT_ACTIVITY_PREFERENCES,
  emptyStateForTab,
  filterNotifications,
  hasUnreadIndicator,
  markAllNotificationsRead,
  nextPanelOpenState,
  orderNotifications,
  parseActivityPreferences,
  persistActivityPreferences,
  readActivityPreferences,
  returnFocusToTrigger,
  type ResellNotification,
} from "./notification-model";

const fixtures: ResellNotification[] = [
  {
    id: "sale-1",
    kind: "sale",
    title: "New sale",
    context: "Vintage camera · eBay",
    message: "A customer purchased the camera for €245.00.",
    timestamp: "Just now",
    read: false,
    isTask: false,
    isUpdate: false,
  },
  {
    id: "shipment-1",
    kind: "shipment",
    title: "Order awaiting shipment",
    context: "Order RH-1048 · Vinted",
    message:
      "Create the shipping label and dispatch this order before tomorrow at 16:00.",
    timestamp: "18m ago",
    read: false,
    isTask: true,
    isUpdate: false,
    action: { label: "Review order", href: "/dashboard" },
  },
  {
    id: "payout-1",
    kind: "payout",
    title: "Payout update",
    context: "Marketplace settlement",
    message: "Your latest settlement statement is ready to review.",
    timestamp: "Yesterday",
    read: true,
    isTask: false,
    isUpdate: true,
    attachment: { label: "settlement-1047.pdf", meta: "248 KB" },
  },
];

describe("notification panel interactions", () => {
  it("toggles open and closed from the bell", () => {
    expect(nextPanelOpenState(false, "toggle")).toBe(true);
    expect(nextPanelOpenState(true, "toggle")).toBe(false);
  });

  it("closes for outside interaction and Escape", () => {
    expect(nextPanelOpenState(true, "outside")).toBe(false);
    expect(nextPanelOpenState(true, "escape")).toBe(false);
    expect(nextPanelOpenState(true, "navigate")).toBe(false);
  });

  it("returns focus to the notification trigger", () => {
    const focus = vi.fn();
    returnFocusToTrigger({ focus });
    expect(focus).toHaveBeenCalledOnce();
  });
});

describe("notification collection behavior", () => {
  it("calculates every tab count from the collection", () => {
    expect(countNotifications(fixtures)).toEqual({
      total: 3,
      unread: 2,
      tasks: 1,
      updates: 1,
    });
  });

  it("filters the collection for each tab", () => {
    expect(filterNotifications(fixtures, "all")).toHaveLength(3);
    expect(filterNotifications(fixtures, "new").map((item) => item.id)).toEqual(
      ["sale-1", "shipment-1"],
    );
    expect(
      filterNotifications(fixtures, "tasks").map((item) => item.id),
    ).toEqual(["shipment-1"]);
    expect(
      filterNotifications(fixtures, "updates").map((item) => item.id),
    ).toEqual(["payout-1"]);
  });

  it("marks unread rows as read without deleting notifications", () => {
    const marked = markAllNotificationsRead(fixtures);
    expect(marked).toHaveLength(fixtures.length);
    expect(marked.every((notification) => notification.read)).toBe(true);
    expect(marked.map((notification) => notification.id)).toEqual(
      fixtures.map((notification) => notification.id),
    );
  });

  it("provides useful empty states for every tab", () => {
    expect(emptyStateForTab("all")).toEqual({
      title: "No activity yet",
      description:
        "Sales, listings, inventory and workspace updates will appear here.",
    });
    expect(emptyStateForTab("new").title).toBe("You are all caught up");
    expect(emptyStateForTab("tasks").title).toBe(
      "No tasks need attention",
    );
    expect(emptyStateForTab("updates").title).toBe("No updates yet");
  });

  it("shows the bell indicator only while unread notifications exist", () => {
    expect(hasUnreadIndicator(fixtures)).toBe(true);
    expect(hasUnreadIndicator(markAllNotificationsRead(fixtures))).toBe(false);
    expect(hasUnreadIndicator([])).toBe(false);
  });

  it("keeps unread activity first without changing order within groups", () => {
    const ordered = orderNotifications(fixtures, true);
    expect(ordered.map((notification) => notification.id)).toEqual([
      "sale-1",
      "shipment-1",
      "payout-1",
    ]);
    expect(orderNotifications([...fixtures].reverse(), false)).toEqual(
      [...fixtures].reverse(),
    );
  });
});

describe("device-local Activity preferences", () => {
  function memoryStorage(initial?: string) {
    const values = new Map<string, string>();
    if (initial !== undefined) {
      values.set(activityPreferencesStorageKey("user-1"), initial);
    }
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
  }

  it("parses valid preferences and safely falls back for invalid storage", () => {
    expect(
      parseActivityPreferences(
        JSON.stringify({ defaultView: "updates", showUnreadFirst: true }),
      ),
    ).toEqual({ defaultView: "updates", showUnreadFirst: true });
    expect(parseActivityPreferences("not-json")).toEqual(
      DEFAULT_ACTIVITY_PREFERENCES,
    );
    expect(
      parseActivityPreferences(
        JSON.stringify({ defaultView: "unknown", showUnreadFirst: "yes" }),
      ),
    ).toEqual(DEFAULT_ACTIVITY_PREFERENCES);
  });

  it("persists and reads preferences through browser-storage semantics", () => {
    const storage = memoryStorage();
    const preferences = { defaultView: "new" as const, showUnreadFirst: true };

    expect(persistActivityPreferences(storage, preferences, "user-1")).toBe(
      true,
    );
    expect(readActivityPreferences(storage, "user-1")).toEqual(preferences);
  });

  it("keeps preferences separate between accounts in the same browser", () => {
    const storage = memoryStorage();
    const userOne = { defaultView: "tasks" as const, showUnreadFirst: true };
    const userTwo = { defaultView: "updates" as const, showUnreadFirst: false };

    persistActivityPreferences(storage, userOne, "user-1");
    persistActivityPreferences(storage, userTwo, "user-2");

    expect(readActivityPreferences(storage, "user-1")).toEqual(userOne);
    expect(readActivityPreferences(storage, "user-2")).toEqual(userTwo);
    expect(activityPreferencesStorageKey("user-1")).not.toBe(
      activityPreferencesStorageKey("user-2"),
    );
  });

  it("does not throw when browser storage is unavailable", () => {
    const unavailableStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readActivityPreferences(unavailableStorage, "user-1")).toEqual(
      DEFAULT_ACTIVITY_PREFERENCES,
    );
    expect(
      persistActivityPreferences(
        unavailableStorage,
        {
          defaultView: "all",
          showUnreadFirst: false,
        },
        "user-1",
      ),
    ).toBe(false);
  });
});
