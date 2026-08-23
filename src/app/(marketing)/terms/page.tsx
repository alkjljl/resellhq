import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { ThemeMenu } from "@/components/shared/theme-menu";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
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
            Terms
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
            By creating and using a ResellHQ account, you agree to provide
            accurate account information, keep your credentials secure, and use
            the service lawfully. You remain responsible for your resale records,
            marketplace obligations, taxes, and compliance requirements.
          </p>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
            ResellHQ may update these terms as the service evolves. Material
            changes will be presented before they apply to future use.
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
