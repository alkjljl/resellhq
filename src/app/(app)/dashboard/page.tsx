import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Globe2,
  Settings2,
  Store,
  UserRound,
} from "lucide-react";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";
import { countryName, formatTimeZone, localeName } from "@/lib/formatting/international";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (!isAccountComplete(account)) redirect("/onboarding");
  if (!account.workspace) {
    throw new Error("Completed account has inconsistent workspace data.");
  }
  const query = await searchParams;

  const summaries = [
    {
      icon: UserRound,
      label: "Profile",
      value: account.profile?.displayName || "Not set",
      href: "/settings/profile",
    },
    {
      icon: Store,
      label: "Workspace",
      value: account.workspace.name,
      href: "/settings/business",
    },
    {
      icon: Globe2,
      label: "Region",
      value: `${countryName(account.workspace.countryCode)} · ${account.workspace.defaultCurrency}`,
      href: "/settings/preferences",
    },
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      {query.setup === "complete" ? (
        <Alert tone="success" className="mb-6">
          Workspace setup is complete. Your regional defaults are ready.
        </Alert>
      ) : null}
      <header className="flex flex-col justify-between gap-5 border-b border-[var(--line)] pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Workspace overview</p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.045em] sm:text-[36px]">
            Welcome, {account.profile?.displayName || "operator"}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
            {account.workspace.name} has a secure account, owner membership, and
            regional foundation in place.
          </p>
        </div>
        <Link
          href="/settings/profile"
          className={buttonVariants({ variant: "secondary" })}
        >
          <Settings2 className="size-4" /> Review settings
        </Link>
      </header>

      <section className="mt-7 border-y border-[var(--line)] bg-[var(--surface)]">
        <div className="grid divide-y divide-[var(--line)] md:grid-cols-3 md:divide-x md:divide-y-0">
          {summaries.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group p-5 outline-none hover:bg-[var(--surface-subtle)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)] sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-[18px] text-[var(--accent)]" />
                  <ArrowRight className="size-4 text-[var(--ink-faint)] transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
                  {item.label}
                </p>
                <p className="mt-1.5 truncate text-sm font-semibold">{item.value}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] px-5 py-4 sm:px-6">
            <p className="eyebrow">Foundation status</p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em]">
              Your operating base is ready
            </h2>
          </div>
          <ul className="divide-y divide-[var(--line)] px-5 sm:px-6">
            {[
              ["Account identity", "Verified through Supabase Auth"],
              ["Workspace ownership", "Owner membership established"],
              ["Regional preferences", `${localeName(account.workspace.locale)} · ${formatTimeZone(account.workspace.timeZone)}`],
              ["Theme preference", account.profile?.themePreference ?? "system"],
            ].map(([title, detail]) => (
              <li key={title} className="flex gap-3 py-4">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                  <Check className="size-3.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] p-5 sm:p-6">
          <p className="eyebrow text-[var(--accent-strong)]">Next product phase</p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">
            Inventory comes next
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
            The next phase will introduce workspace-owned items, acquisition
            costs, condition, location, and lifecycle status. No placeholder
            inventory or financial results are shown before that data exists.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[var(--accent-strong)]">
            <span className="size-2 rounded-full bg-[var(--accent)]" />
            Planned · not yet available
          </div>
        </section>
      </div>
    </div>
  );
}
