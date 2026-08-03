import {
  ArrowRight,
  Boxes,
  Check,
  CircleDollarSign,
  Globe2,
  ListChecks,
  LockKeyhole,
  Store,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/shared/brand";
import { ThemeMenu } from "@/components/shared/theme-menu";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentAccount } from "@/lib/auth/account";
import { resolveRootDestination } from "@/lib/auth/routing";
import { cn } from "@/lib/cn";

const workflow = [
  ["Source", "Record what you bought and the true acquisition cost.", "Upcoming"],
  ["Prepare", "Organize condition, location, pricing, and listing readiness.", "Upcoming"],
  ["Sell", "Track marketplace orders, fees, shipping, and completion.", "Upcoming"],
  ["Understand", "Turn verified records into profit and performance reporting.", "Upcoming"],
] as const;

const capabilities = [
  {
    icon: Boxes,
    title: "Inventory control",
    copy: "A workspace-owned source of truth for items, variants, condition, cost, and location.",
  },
  {
    icon: ListChecks,
    title: "Listing operations",
    copy: "Coordinate what is ready, active, sold, or stale across regional marketplaces.",
  },
  {
    icon: CircleDollarSign,
    title: "Profit clarity",
    copy: "Connect acquisition cost, marketplace fees, shipping, expenses, and settled proceeds.",
  },
  {
    icon: Workflow,
    title: "Repeatable workflows",
    copy: "Replace scattered tabs and ad hoc notes with a consistent operating sequence.",
  },
] as const;

export default async function MarketingPage() {
  const destination = await resolveRootDestination(getCurrentAccount);
  if (destination) redirect(destination);

  return (
    <div className="bg-[var(--canvas)] text-[var(--ink)]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center px-5 sm:px-7 lg:px-9">
          <Brand compact className="sm:hidden" />
          <Brand className="hidden sm:inline-flex" />
          <nav className="ml-auto hidden items-center gap-7 text-sm text-[var(--ink-muted)] md:flex" aria-label="Main">
            <a href="#why" className="hover:text-[var(--ink)]">Why ResellHQ</a>
            <a href="#workflow" className="hover:text-[var(--ink)]">Workflow</a>
            <a href="#roadmap" className="hover:text-[var(--ink)]">Roadmap</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-8">
            <ThemeMenu />
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden sm:inline-flex",
              )}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              Start setup
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto grid min-h-[690px] max-w-[1240px] items-center gap-12 px-5 py-16 sm:px-7 lg:grid-cols-[1.03fr_.97fr] lg:px-9 lg:py-20">
            <div>
              <p className="eyebrow">The operating system for independent resale</p>
              <h1 className="display-heading mt-5 max-w-3xl text-[46px] leading-[0.98] tracking-[-0.06em] sm:text-[64px] lg:text-[72px]">
                Run the business behind every resale.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[var(--ink-muted)] sm:text-lg">
                ResellHQ is being built for operators who source across
                categories and sell across marketplaces—without losing control
                of inventory, costs, fees, and decisions.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className={buttonVariants({ variant: "primary", size: "lg" })}
                >
                  Create your workspace <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#product"
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  View the product
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="border border-[var(--line-strong)] bg-[var(--canvas)] p-3 shadow-[var(--shadow-md)]">
                <div className="border border-[var(--line)] bg-[var(--surface)]">
                  <div className="flex items-center border-b border-[var(--line)] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-md bg-[var(--accent)] text-[var(--accent-ink)]">
                        <Store className="size-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold">Operator workspace</p>
                        <p className="text-[10px] text-[var(--ink-faint)]">Foundation map</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-[150px_1fr]">
                    <div className="border-b border-[var(--line)] p-3 sm:border-b-0 sm:border-r">
                      {["Dashboard", "Settings"].map((item, index) => (
                        <div
                          key={item}
                          className={`mb-1 flex items-center gap-2 px-2.5 py-2 text-xs ${
                            index === 0
                              ? "bg-[var(--nav-active)] font-semibold"
                              : "text-[var(--ink-muted)]"
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-[var(--accent)]" />
                          {item}
                        </div>
                      ))}
                      <p className="mt-5 px-2 text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--ink-faint)]">
                        Upcoming
                      </p>
                      {["Inventory", "Listings", "Sales"].map((item) => (
                        <div key={item} className="px-2 py-1.5 text-[11px] text-[var(--ink-faint)]">
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="eyebrow">Workspace ready</p>
                      <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
                        A clean base for real records
                      </h2>
                      <div className="mt-6 space-y-3">
                        {[
                          "Verified account identity",
                          "Workspace ownership",
                          "Country, currency, locale, and time zone",
                          "Light, dark, and system themes",
                        ].map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 border-b border-[var(--line)] pb-3 text-xs last:border-0"
                          >
                            <span className="grid size-5 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                              <Check className="size-3" />
                            </span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="scroll-mt-20 border-b border-[var(--line)]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-7 lg:px-9 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
              <div>
                <p className="eyebrow">Why the system matters</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                  Spreadsheets record pieces. Operators need the whole chain.
                </h2>
              </div>
              <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
                {[
                  ["Fragmented stock", "Items live in notes, marketplace drafts, storage bins, and memory."],
                  ["Invisible cost", "Fees, shipping, supplies, and returns separate from the original purchase."],
                  ["Duplicated work", "The same details are re-entered differently across every selling channel."],
                  ["Late decisions", "Without connected records, pricing and sourcing decisions arrive after the margin is gone."],
                ].map(([title, copy]) => (
                  <article key={title} className="bg-[var(--surface)] p-6 sm:p-7">
                    <h3 className="text-base font-semibold">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-20 border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-7 lg:px-9 lg:py-28">
            <div className="max-w-2xl">
              <p className="eyebrow">One operating workflow</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                From acquisition to a defensible profit number.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">
                ResellHQ’s roadmap connects each operational step to the same
                workspace-owned record. The modules below are product direction,
                not claims of current availability.
              </p>
            </div>
            <ol className="mt-12 grid border-y border-[var(--line)] md:grid-cols-4 md:divide-x md:divide-[var(--line)]">
              {workflow.map(([title, copy, status], index) => (
                <li key={title} className="border-b border-[var(--line)] p-6 last:border-0 md:border-b-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--accent)]">0{index + 1}</span>
                    <span className="status-pill">{status}</span>
                  </div>
                  <h3 className="mt-8 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="roadmap" className="scroll-mt-20 border-b border-[var(--line)]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-7 lg:px-9 lg:py-28">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="eyebrow">Core product direction</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                  Built around the business, not one marketplace.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[var(--ink-muted)]">
                Electronics, apparel, watches, cards, furniture, books, parts,
                wholesale, liquidation, and other resale models all need the
                same trustworthy operating core.
              </p>
            </div>
            <div className="mt-12 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="bg-[var(--surface)] p-6">
                    <Icon className="size-5 text-[var(--accent)]" />
                    <h3 className="mt-8 text-base font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
                      {item.copy}
                    </p>
                    <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--ink-faint)]">
                      Upcoming
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--line)] bg-[var(--contrast-surface)] text-[var(--contrast-ink)]">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-20 sm:px-7 lg:grid-cols-2 lg:px-9 lg:py-24">
            <div>
              <Globe2 className="size-7 text-[var(--accent-inverse)]" />
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Regional by default. Worldwide by design.
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ["Countries", "Canonical ISO country codes"],
                ["Currencies", "ISO currency configuration"],
                ["Languages", "Locale-aware product foundation"],
                ["Time", "IANA time-zone identifiers"],
              ].map(([title, copy]) => (
                <div key={title} className="border-t border-[var(--contrast-line)] pt-4">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--contrast-muted)]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="product" className="scroll-mt-20 border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-20 sm:px-7 lg:grid-cols-[.8fr_1.2fr] lg:px-9 lg:py-24">
            <div>
              <LockKeyhole className="size-6 text-[var(--accent)]" />
              <p className="eyebrow mt-5">Ready to use</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em]">
                Start with a foundation you will keep.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Email and Google authentication",
                "Email verification and recovery",
                "Personal profile",
                "Business workspace",
                "Owner membership",
                "International preferences",
                "Responsive application shell",
                "Light, dark, and system themes",
              ].map((item) => (
                <div key={item} className="flex gap-3 border-b border-[var(--line)] py-3 text-sm">
                  <Check className="size-4 shrink-0 text-[var(--success)]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--accent-soft)]">
          <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-7 px-5 py-16 sm:px-7 md:flex-row md:items-center lg:px-9">
            <div>
              <p className="eyebrow text-[var(--accent-strong)]">Build the base now</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
                Give your resale operation a real home.
              </h2>
            </div>
            <Link
              href="/signup"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Create your workspace <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-8 text-xs text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-9">
          <Brand />
          <p>© {new Date().getFullYear()} ResellHQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
