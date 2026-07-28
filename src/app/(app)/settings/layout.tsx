import type { ReactNode } from "react";
import { SettingsNav } from "@/components/layout/settings-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1040px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <header className="border-b border-[var(--line)] pb-6">
        <p className="eyebrow">Workspace administration</p>
        <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.045em]">
          Settings
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Keep account identity, business configuration, and regional defaults accurate.
        </p>
      </header>
      <div className="mt-6 grid gap-7 lg:grid-cols-[190px_1fr]">
        <SettingsNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
