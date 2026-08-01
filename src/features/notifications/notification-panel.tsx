"use client";

import {
  BadgeDollarSign,
  Bell,
  Boxes,
  ChevronRight,
  CircleAlert,
  Cog,
  FileText,
  PackageCheck,
  ReceiptText,
  Sparkles,
  Tags,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  ACTIVITY_PREFERENCES_CHANGED_EVENT,
  activityPreferencesStorageKey,
  countNotifications,
  DEFAULT_ACTIVITY_PREFERENCES,
  emptyStateForTab,
  filterNotifications,
  hasUnreadIndicator,
  markAllNotificationsRead,
  nextPanelOpenState,
  NOTIFICATION_TABS,
  orderNotifications,
  readActivityPreferences,
  returnFocusToTrigger,
  type ActivityPreferences,
  type NotificationKind,
  type NotificationTab,
  type PanelCloseReason,
  type ResellNotification,
} from "./notification-model";

const EMPTY_NOTIFICATIONS: readonly ResellNotification[] = [];

const KIND_DETAILS: Record<
  NotificationKind,
  {
    label: string;
    icon: LucideIcon;
    badgeClassName: string;
    iconClassName: string;
  }
> = {
  sale: {
    label: "Sale",
    icon: BadgeDollarSign,
    badgeClassName:
      "border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--success)]",
    iconClassName: "bg-[var(--success-soft)] text-[var(--success)]",
  },
  shipment: {
    label: "Shipping",
    icon: Truck,
    badgeClassName:
      "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-strong)]",
    iconClassName: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  },
  "listing-failure": {
    label: "Listing",
    icon: CircleAlert,
    badgeClassName:
      "border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--danger)]",
    iconClassName: "bg-[var(--danger-soft)] text-[var(--danger)]",
  },
  "price-review": {
    label: "Task",
    icon: Tags,
    badgeClassName:
      "border-[var(--line)] bg-[var(--surface-subtle)] text-[var(--ink-muted)]",
    iconClassName: "bg-[var(--surface-subtle)] text-[var(--ink-muted)]",
  },
  payout: {
    label: "Payout",
    icon: FileText,
    badgeClassName:
      "border-[var(--line)] bg-[var(--surface-subtle)] text-[var(--ink-muted)]",
    iconClassName: "bg-[var(--surface-subtle)] text-[var(--ink-muted)]",
  },
  "missing-cost": {
    label: "Cost",
    icon: ReceiptText,
    badgeClassName:
      "border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--danger)]",
    iconClassName: "bg-[var(--danger-soft)] text-[var(--danger)]",
  },
  inventory: {
    label: "Inventory",
    icon: Boxes,
    badgeClassName:
      "border-[var(--line)] bg-[var(--surface-subtle)] text-[var(--ink-muted)]",
    iconClassName: "bg-[var(--surface-subtle)] text-[var(--ink-muted)]",
  },
  system: {
    label: "Update",
    icon: Sparkles,
    badgeClassName:
      "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-strong)]",
    iconClassName: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  },
};

type PanelPosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

export function NotificationPanel({
  userId,
  items = EMPTY_NOTIFICATIONS,
  defaultOpen = false,
  defaultPreferences = DEFAULT_ACTIVITY_PREFERENCES,
}: {
  userId: string;
  items?: readonly ResellNotification[];
  defaultOpen?: boolean;
  defaultPreferences?: ActivityPreferences;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<NotificationTab>(
    defaultPreferences.defaultView,
  );
  const [activityPreferences, setActivityPreferences] =
    useState<ActivityPreferences>(defaultPreferences);
  const [notifications, setNotifications] = useState<ResellNotification[]>(() => [
    ...items,
  ]);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const descriptionId = `${panelId}-description`;

  const counts = useMemo(
    () => countNotifications(notifications),
    [notifications],
  );
  const filtered = useMemo(
    () =>
      orderNotifications(
        filterNotifications(notifications, activeTab),
        activityPreferences.showUnreadFirst,
      ),
    [activeTab, activityPreferences.showUnreadFirst, notifications],
  );
  const unreadIndicator = hasUnreadIndicator(notifications);
  const emptyState = emptyStateForTab(activeTab);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const margin = 8;
    const gap = 8;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(395, window.innerWidth - margin * 2);
    const left = Math.min(
      Math.max(margin, rect.right - width),
      window.innerWidth - width - margin,
    );
    const top = rect.bottom + gap;
    const maxHeight = Math.min(
      620,
      Math.max(0, window.innerHeight - top - margin),
    );

    setPosition({ left, top, width, maxHeight });
  }, []);

  const closePanel = useCallback((reason: PanelCloseReason) => {
    setOpen((current) => nextPanelOpenState(current, reason));
    if (reason === "navigate") return;
    window.requestAnimationFrame(() =>
      returnFocusToTrigger(triggerRef.current),
    );
  }, []);

  useEffect(() => {
    const syncPreferences = () => {
      const nextPreferences = readActivityPreferences(
        window.localStorage,
        userId,
      );
      setActivityPreferences(nextPreferences);
      setActiveTab(nextPreferences.defaultView);
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key !== null &&
        event.key !== activityPreferencesStorageKey(userId)
      ) {
        return;
      }
      syncPreferences();
    };

    syncPreferences();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      ACTIVITY_PREFERENCES_CHANGED_EVENT,
      syncPreferences,
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        ACTIVITY_PREFERENCES_CHANGED_EVENT,
        syncPreferences,
      );
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        closePanel("outside");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closePanel("escape");
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePanel, open, updatePosition]);

  const markAllRead = () => {
    if (counts.unread === 0) return;
    const markedCount = counts.unread;
    setNotifications((current) => markAllNotificationsRead(current));
    setAnnouncement(
      `${markedCount} activity item${markedCount === 1 ? "" : "s"} marked as read.`,
    );
  };

  const style: CSSProperties | undefined = position
    ? {
        left: position.left,
        top: position.top,
        width: position.width,
        maxHeight: position.maxHeight,
      }
    : undefined;

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className={cn(
          "relative size-9 rounded-sm border border-[var(--line)]",
          open && "bg-[var(--surface-subtle)] ring-2 ring-[var(--focus-soft)]",
        )}
        aria-label={
          counts.unread > 0
            ? `Activity, ${counts.unread} unread`
            : "Activity, no unread items"
        }
        aria-controls={open ? panelId : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-pressed={open}
        onClick={() => setOpen((current) => nextPanelOpenState(current, "toggle"))}
      >
        <Bell className="size-3.5" aria-hidden="true" />
        {unreadIndicator ? (
          <span
            className="absolute right-1.5 top-1.5 size-1 rounded-full bg-[var(--accent)]"
            aria-hidden="true"
          />
        ) : null}
      </Button>

      {open ? (
        <section
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          style={style}
          className={cn(
            "fixed z-50 flex min-h-0 flex-col overflow-hidden rounded-[23px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]",
            !position && "invisible",
          )}
        >
          <header className="shrink-0 border-b border-[var(--line)] px-4 pb-2 pt-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  <Bell className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2
                    id={titleId}
                    className="truncate text-base font-semibold tracking-[-0.025em]"
                  >
                    Activity
                  </h2>
                  <p
                    id={descriptionId}
                    className="mt-0.5 text-[11px] font-medium text-[var(--ink-muted)]"
                  >
                    {counts.unread > 0
                      ? `${counts.unread} new`
                      : "All caught up"}{" "}
                    · {counts.total} total
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-10 shrink-0 rounded-lg px-2.5 text-[11px] text-[var(--accent-strong)]"
                disabled={counts.unread === 0}
                onClick={markAllRead}
              >
                <PackageCheck className="size-3.5" aria-hidden="true" />
                Mark all read
              </Button>
            </div>

            <div
              role="tablist"
              aria-label="Activity filters"
              className="mt-2 flex min-w-0 gap-1 overflow-x-auto pb-1"
            >
              {NOTIFICATION_TABS.map((tab) => {
                const count =
                  tab.id === "all"
                    ? counts.total
                    : tab.id === "new"
                      ? counts.unread
                      : tab.id === "tasks"
                        ? counts.tasks
                        : counts.updates;
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`${panelId}-tabpanel`}
                    className={cn(
                      "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                      active
                        ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                        : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]",
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        "grid min-w-4 place-items-center rounded-full px-1 py-0.5 text-[9px] tabular-nums",
                        active
                          ? "bg-[color:var(--surface)] text-[var(--ink)]"
                          : "bg-[var(--surface-subtle)] text-[var(--ink-faint)]",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </header>

          <div
            id={`${panelId}-tabpanel`}
            role="tabpanel"
            aria-label={`${NOTIFICATION_TABS.find((tab) => tab.id === activeTab)?.label ?? "All"} activity`}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            {filtered.length === 0 ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center px-6 py-10 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-[var(--surface-subtle)] text-[var(--ink-faint)]">
                  <Bell className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">
                  {emptyState.title}
                </h3>
                <p className="mt-1 max-w-[270px] text-xs leading-5 text-[var(--ink-muted)]">
                  {emptyState.description}
                </p>
              </div>
            ) : (
              <div>
                {filtered.map((notification, index) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    divided={index > 0}
                  />
                ))}
              </div>
            )}
          </div>

          <footer className="shrink-0 border-t border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-1.5">
            <div className="flex min-h-11 items-center justify-between gap-2">
              <p className="flex min-w-0 items-center gap-2 truncate text-xs text-[var(--ink-muted)]">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    counts.unread > 0
                      ? "bg-[var(--accent)]"
                      : "bg-[var(--ink-faint)]",
                  )}
                  aria-hidden="true"
                />
                {counts.unread > 0
                  ? `${counts.unread} unread`
                  : "Up to date"}
              </p>
              <Link
                href="/settings/preferences#activity"
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-[var(--ink-muted)] outline-none transition-colors hover:bg-[var(--surface-strong)] hover:text-[var(--ink)] active:bg-[var(--nav-active)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                onClick={() => closePanel("navigate")}
              >
                <Cog className="size-3.5 shrink-0" aria-hidden="true" />
                <span>Manage</span>
                <ChevronRight
                  className="size-3 shrink-0"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </footer>

          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>
        </section>
      ) : null}
    </>
  );
}

function NotificationRow({
  notification,
  divided,
}: {
  notification: ResellNotification;
  divided: boolean;
}) {
  const details = KIND_DETAILS[notification.kind];
  const Icon = details.icon;

  return (
    <article
      className={cn(
        "relative flex gap-3 px-4 py-3.5",
        divided && "border-t border-[var(--line)]",
        !notification.read && "bg-[var(--accent-soft)]/30",
      )}
    >
      {!notification.read ? (
        <span
          className="absolute left-0 top-3.5 h-8 w-0.5 rounded-r-full bg-[var(--accent)]"
          aria-label="Unread"
        />
      ) : null}
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          details.iconClassName,
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-semibold">{notification.title}</h3>
            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                details.badgeClassName,
              )}
            >
              {details.label}
            </span>
          </div>
          <time className="font-data shrink-0 text-[10px] text-[var(--ink-faint)]">
            {notification.timestamp}
          </time>
        </div>
        <p className="mt-0.5 text-[11px] font-medium text-[var(--ink-muted)]">
          {notification.context}
        </p>
        <p className="mt-1.5 text-sm leading-5 text-[var(--ink)]">
          {notification.message}
        </p>

        {notification.attachment ? (
          <div className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-subtle)] px-2.5 py-1.5">
            <FileText
              className="size-3.5 shrink-0 text-[var(--ink-muted)]"
              aria-hidden="true"
            />
            <span className="truncate text-xs font-medium">
              {notification.attachment.label}
            </span>
            <span className="shrink-0 text-xs text-[var(--ink-faint)]">
              · {notification.attachment.meta}
            </span>
          </div>
        ) : null}

        {notification.action ? (
          <div className="mt-2.5">
            <Link
              href={notification.action.href}
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
              })}
            >
              {notification.action.label}
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}
