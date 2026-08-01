export type NotificationKind =
  | "sale"
  | "shipment"
  | "listing-failure"
  | "price-review"
  | "payout"
  | "missing-cost"
  | "inventory"
  | "system";

export type NotificationTab = "all" | "new" | "tasks" | "updates";

export type ActivityPreferences = {
  defaultView: NotificationTab;
  showUnreadFirst: boolean;
};

export type ActivityPreferencesStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type ResellNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  context: string;
  message: string;
  timestamp: string;
  read: boolean;
  isTask: boolean;
  isUpdate: boolean;
  action?: {
    label: string;
    href: string;
  };
  attachment?: {
    label: string;
    meta: string;
  };
};

export type NotificationCounts = {
  total: number;
  unread: number;
  tasks: number;
  updates: number;
};

export type PanelCloseReason = "outside" | "escape" | "navigate";
export type PanelEvent = "toggle" | PanelCloseReason;

export const ACTIVITY_PREFERENCES_STORAGE_KEY =
  "resellhq.activity-preferences.v1";
export const ACTIVITY_PREFERENCES_CHANGED_EVENT =
  "resellhq:activity-preferences-changed";

export function activityPreferencesStorageKey(userId: string) {
  return `${ACTIVITY_PREFERENCES_STORAGE_KEY}.${encodeURIComponent(userId)}`;
}

export const DEFAULT_ACTIVITY_PREFERENCES: ActivityPreferences = {
  defaultView: "all",
  showUnreadFirst: false,
};

export const NOTIFICATION_TABS: ReadonlyArray<{
  id: NotificationTab;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "tasks", label: "Tasks" },
  { id: "updates", label: "Updates" },
];

export function nextPanelOpenState(open: boolean, event: PanelEvent) {
  return event === "toggle" ? !open : false;
}

export function countNotifications(
  notifications: readonly ResellNotification[],
): NotificationCounts {
  return {
    total: notifications.length,
    unread: notifications.filter((notification) => !notification.read).length,
    tasks: notifications.filter((notification) => notification.isTask).length,
    updates: notifications.filter((notification) => notification.isUpdate)
      .length,
  };
}

export function filterNotifications(
  notifications: readonly ResellNotification[],
  tab: NotificationTab,
) {
  if (tab === "new") {
    return notifications.filter((notification) => !notification.read);
  }
  if (tab === "tasks") {
    return notifications.filter((notification) => notification.isTask);
  }
  if (tab === "updates") {
    return notifications.filter((notification) => notification.isUpdate);
  }
  return [...notifications];
}

export function markAllNotificationsRead(
  notifications: readonly ResellNotification[],
) {
  return notifications.map((notification) =>
    notification.read ? notification : { ...notification, read: true },
  );
}

export function orderNotifications(
  notifications: readonly ResellNotification[],
  showUnreadFirst: boolean,
) {
  if (!showUnreadFirst) return [...notifications];

  return [
    ...notifications.filter((notification) => !notification.read),
    ...notifications.filter((notification) => notification.read),
  ];
}

export function parseActivityPreferences(
  value: string | null,
): ActivityPreferences {
  if (!value) return { ...DEFAULT_ACTIVITY_PREFERENCES };

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_ACTIVITY_PREFERENCES };
    }

    const candidate = parsed as Partial<ActivityPreferences>;
    const validTab = NOTIFICATION_TABS.some(
      (tab) => tab.id === candidate.defaultView,
    );

    return {
      defaultView: validTab
        ? (candidate.defaultView as NotificationTab)
        : DEFAULT_ACTIVITY_PREFERENCES.defaultView,
      showUnreadFirst:
        typeof candidate.showUnreadFirst === "boolean"
          ? candidate.showUnreadFirst
          : DEFAULT_ACTIVITY_PREFERENCES.showUnreadFirst,
    };
  } catch {
    return { ...DEFAULT_ACTIVITY_PREFERENCES };
  }
}

export function readActivityPreferences(
  storage: ActivityPreferencesStorage,
  userId: string,
): ActivityPreferences {
  try {
    return parseActivityPreferences(
      storage.getItem(activityPreferencesStorageKey(userId)),
    );
  } catch {
    return { ...DEFAULT_ACTIVITY_PREFERENCES };
  }
}

export function persistActivityPreferences(
  storage: ActivityPreferencesStorage,
  preferences: ActivityPreferences,
  userId: string,
) {
  try {
    storage.setItem(
      activityPreferencesStorageKey(userId),
      JSON.stringify(preferences),
    );
    return true;
  } catch {
    return false;
  }
}

export function emptyStateForTab(tab: NotificationTab) {
  if (tab === "new") {
    return {
      title: "You are all caught up",
      description: "New activity will appear here.",
    };
  }
  if (tab === "tasks") {
    return {
      title: "No tasks need attention",
      description: "Price reviews and operational follow-ups will appear here.",
    };
  }
  if (tab === "updates") {
    return {
      title: "No updates yet",
      description: "Inventory, payout, and system updates will appear here.",
    };
  }
  return {
    title: "No activity yet",
    description:
      "Sales, listings, inventory and workspace updates will appear here.",
  };
}

export function hasUnreadIndicator(
  notifications: readonly ResellNotification[],
) {
  return notifications.some((notification) => !notification.read);
}

export function returnFocusToTrigger(
  trigger: { focus: () => void } | null,
) {
  trigger?.focus();
}
