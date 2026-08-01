"use client";

import { useEffect, useRef, useState } from "react";
import { SettingsPanel } from "@/components/layout/settings-panel";
import { FormField } from "@/components/shared/form-field";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import {
  ACTIVITY_PREFERENCES_CHANGED_EVENT,
  DEFAULT_ACTIVITY_PREFERENCES,
  NOTIFICATION_TABS,
  persistActivityPreferences,
  readActivityPreferences,
  type ActivityPreferences,
  type NotificationTab,
} from "./notification-model";

export function ActivityPreferencesSection({ userId }: { userId: string }) {
  const [preferences, setPreferences] = useState<ActivityPreferences>(
    DEFAULT_ACTIVITY_PREFERENCES,
  );
  const [storageError, setStorageError] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setPreferences(readActivityPreferences(window.localStorage, userId));

    let focusFrame: number | null = null;
    const focusSectionFromHash = () => {
      if (window.location.hash !== "#activity") return;
      if (focusFrame !== null) window.cancelAnimationFrame(focusFrame);
      focusFrame = window.requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ block: "start" });
        sectionRef.current?.focus({ preventScroll: true });
      });
    };

    focusSectionFromHash();
    window.addEventListener("hashchange", focusSectionFromHash);

    return () => {
      if (focusFrame !== null) window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("hashchange", focusSectionFromHash);
    };
  }, [userId]);

  const savePreferences = (nextPreferences: ActivityPreferences) => {
    setPreferences(nextPreferences);
    const saved = persistActivityPreferences(
      window.localStorage,
      nextPreferences,
      userId,
    );
    setStorageError(!saved);
    if (saved) {
      window.dispatchEvent(new Event(ACTIVITY_PREFERENCES_CHANGED_EVENT));
    }
  };

  return (
    <section
      ref={sectionRef}
      id="activity"
      tabIndex={-1}
      className="scroll-mt-24 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]"
    >
      <SettingsPanel
        title="Activity"
        description="Choose how the Activity panel is organized on this device."
      >
        <div className="space-y-5">
          <FormField
            id="activityDefaultView"
            label="Default view"
            description="The tab selected when your Activity preferences are loaded."
          >
            <Select
              id="activityDefaultView"
              value={preferences.defaultView}
              onChange={(event) =>
                savePreferences({
                  ...preferences,
                  defaultView: event.target.value as NotificationTab,
                })
              }
            >
              {NOTIFICATION_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="flex min-h-16 items-center justify-between gap-4 rounded-md border border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-3">
            <div className="min-w-0">
              <p
                id="activityUnreadFirstLabel"
                className="text-sm font-medium text-[var(--ink)]"
              >
                Show unread activity first
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">
                Keep unread items above activity you have already reviewed.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="text-xs font-medium text-[var(--ink-muted)]">
                {preferences.showUnreadFirst ? "On" : "Off"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.showUnreadFirst}
                aria-labelledby="activityUnreadFirstLabel"
                className={cn(
                  "relative h-7 w-12 rounded-full border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                  preferences.showUnreadFirst
                    ? "border-[var(--accent-line)] bg-[var(--accent)]"
                    : "border-[var(--line-strong)] bg-[var(--surface)]",
                )}
                onClick={() =>
                  savePreferences({
                    ...preferences,
                    showUnreadFirst: !preferences.showUnreadFirst,
                  })
                }
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform",
                    preferences.showUnreadFirst
                      ? "translate-x-[22px]"
                      : "translate-x-1",
                  )}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <div className="border-t border-[var(--line)] pt-4">
            <p
              className="text-xs font-semibold text-[var(--ink)]"
              aria-live="polite"
            >
              {storageError
                ? "Could not save on this device"
                : "Saved on this device"}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">
              These Activity preferences are stored separately for this
              account in this browser and do not sync to other devices.
            </p>
          </div>
        </div>
      </SettingsPanel>
    </section>
  );
}
