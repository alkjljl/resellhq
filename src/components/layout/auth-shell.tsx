import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/shared/brand";
import { ThemeMenu } from "@/components/shared/theme-menu";

export function AuthShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main className="auth-canvas min-h-screen px-5 py-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
        <div className="flex items-center justify-between">
          <Brand compact className="sm:hidden" />
          <Brand className="hidden sm:inline-flex" />
          <div className="flex items-center gap-2">
            <ThemeMenu />
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            >
              <span className="sm:hidden">Overview</span>
              <span className="hidden sm:inline">Back to overview</span>
            </Link>
          </div>
        </div>
        <div className="grid flex-1 place-items-center py-10">
          <section className="w-full max-w-[460px] rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] sm:p-9">
            <header>
              <p className="eyebrow">Merchant Ledger</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-[28px]">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                {description}
              </p>
            </header>
            <div className="mt-7">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
