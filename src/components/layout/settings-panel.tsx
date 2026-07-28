import type { ReactNode } from "react";

export function SettingsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      <header className="border-b border-[var(--line)] px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold tracking-[-0.02em]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">
          {description}
        </p>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
