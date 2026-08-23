import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { ThemeMenu } from "@/components/shared/theme-menu";

export const metadata: Metadata = { title: "Privacy Notice" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] px-5 py-8 text-[var(--ink)]">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between">
          <Brand />
          <ThemeMenu />
        </header>
        <article className="mt-10 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] sm:p-10">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Privacy Notice
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
            ResellHQ processes the account, profile, workspace, and regional
            preference information needed to provide the service. Authentication
            data is handled through the configured authentication provider.
          </p>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
            Account information is not presented as public profile data. Access
            is restricted to the authenticated account and authorized workspace
            members according to the application&apos;s access controls.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex min-h-11 items-center font-medium text-[var(--accent-strong)] underline underline-offset-4"
          >
            Return to account creation
          </Link>
        </article>
      </div>
    </main>
  );
}
