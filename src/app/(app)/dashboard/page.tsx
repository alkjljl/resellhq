import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";

export const metadata: Metadata = { title: "Dashboard" };

const pipeline = [
  { label: "In stock", detail: "Bought, not listed", tone: "muted" },
  { label: "Listed", detail: "Visible to buyers", tone: "neutral" },
  { label: "Reserved", detail: "Sale pending", tone: "accent" },
  { label: "Sold", detail: "Completed this month", tone: "accent" },
] as const;

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
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  })
    .format(new Date())
    .replace(",", "  · ");

  return (
    <div className="dashboard-canvas">
      <div className="mx-auto max-w-[1180px] px-4 pb-10 pt-7 sm:px-6 lg:px-7 lg:pt-9">
        {query.setup === "complete" ? (
          <Alert tone="success" className="mb-6">
            Workspace setup is complete. Your resale desk is ready.
          </Alert>
        ) : null}

        <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-[var(--accent-strong)]">{date}</p>
            <h1 className="display-heading mt-2 text-[34px] leading-none tracking-[-0.035em] sm:text-[40px]">
              Your resale desk
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--ink-muted)]">
              See what is moving, what is stuck, and what you actually keep.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:pb-0.5">
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Sales are planned and not yet available"
              className="dashboard-button dashboard-button-secondary"
            >
              Record sale
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Inventory is planned and not yet available"
              className="dashboard-button dashboard-button-primary"
            >
              <Plus className="size-4" strokeWidth={1.5} />
              Add inventory
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(250px,.9fr)]">
          <section className="profit-ticket" data-decoration-boundary>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                  Net profit · planned reporting
                </p>
                <p className="display-heading mt-2 text-[46px] leading-none tabular-nums tracking-[-0.045em] sm:text-[52px]">
                  —
                </p>
              </div>
              <span className="rounded-full border border-[var(--line-strong)] px-3 py-1 text-xs text-[var(--ink-muted)]">
                Not yet available
              </span>
            </div>

            <div className="ticket-rule my-6" />

            <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4">
              {["Sales", "Stock cost", "Fees + expenses", "You keep"].map(
                (label, index) => (
                  <div
                    key={label}
                    className="relative pr-4 sm:border-r sm:border-dashed sm:border-[var(--line)] sm:pl-4 sm:first:pl-0 sm:last:border-r-0"
                  >
                    <p className="text-xs text-[var(--ink-faint)]">
                      {label}
                    </p>
                    <p
                      className={`data-value mt-2 text-sm ${
                        index === 3 ? "text-[var(--accent-strong)]" : ""
                      }`}
                    >
                      —
                    </p>
                  </div>
                ),
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2 border-t border-dashed border-[var(--line)] pt-5 text-xs text-[var(--ink-faint)] sm:flex-row sm:items-center sm:justify-between">
              <span>Profit reporting is planned and not yet connected.</span>
              <span className="text-[var(--ink-muted)]">
                No business data is connected.
              </span>
            </div>
          </section>

          <section
            className="metric-rail border-y border-[var(--line)]"
            aria-label="Business metrics"
          >
            {[
              ["01", "Inventory value", "Inventory tracking is planned"],
              ["02", "Active listings", "Listing tracking is planned"],
              ["03", "Sales this month", "Sales tracking is planned"],
            ].map(([number, label, detail]) => (
              <div
                key={label}
                className="grid min-h-[88px] grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 border-b border-[var(--line)] px-3 last:border-b-0"
              >
                <span className="font-data self-start pt-5 text-xs text-[var(--ink-faint)]">
                  {number}
                </span>
                <div>
                  <p className="text-xs font-medium text-[var(--ink-muted)]">{label}</p>
                  <p className="mt-2 text-xs text-[var(--ink-faint)]">{detail}</p>
                </div>
                <p className="data-value text-[22px] font-medium tracking-[-0.035em]">
                  —
                </p>
              </div>
            ))}
          </section>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,.95fr)]">
          <section className="ledger-panel min-h-[310px]">
            <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="font-data text-xs text-[var(--ink-faint)]">A</span>
                <div>
                  <h2 className="text-[17px] font-semibold leading-none tracking-[-0.02em]">
                    Profit trail
                  </h2>
                  <p className="mt-2 text-xs text-[var(--ink-faint)]">
                    Planned reporting for future sales data.
                  </p>
                </div>
              </div>
              <div
                className="font-data flex items-center justify-between gap-3 text-xs uppercase text-[var(--ink-faint)] sm:justify-start sm:gap-5"
                aria-label="Reporting time ranges are not yet available"
              >
                <button
                  type="button"
                  disabled
                  title="Reporting is not yet available"
                  className="min-h-11 min-w-11 cursor-not-allowed border-b border-[var(--accent)] px-1 text-[var(--ink)]"
                >
                  30d
                </button>
                <button
                  type="button"
                  disabled
                  title="Reporting is not yet available"
                  className="min-h-11 min-w-11 cursor-not-allowed px-1"
                >
                  12m
                </button>
                <button
                  type="button"
                  disabled
                  title="Reporting is not yet available"
                  className="min-h-11 min-w-11 cursor-not-allowed px-1"
                >
                  All
                </button>
              </div>
            </div>

            <div className="profit-plot relative mx-4 mt-5 min-h-[200px] border-b border-l border-[var(--line)] sm:mx-5">
              <div className="absolute inset-x-0 bottom-8 flex min-w-0 items-center justify-between px-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-3 rounded-full bg-[var(--accent)]" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">
                      Reporting not available
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--ink-faint)]">
                      Sales data will appear here when tracking is available.
                    </p>
                  </div>
                </div>
                <span className="hidden text-xs text-[var(--ink-muted)] sm:block">
                  Sales tracking planned
                </span>
              </div>
              <span className="absolute -bottom-6 left-0 text-xs text-[var(--ink-faint)]">
                Start
              </span>
              <span className="absolute -bottom-6 right-0 text-xs text-[var(--ink-faint)]">
                Now
              </span>
            </div>
          </section>

          <section className="ledger-panel">
            <div className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-4">
              <span className="font-data text-xs text-[var(--ink-faint)]">B</span>
              <div>
                <h2 className="text-[17px] font-semibold leading-none tracking-[-0.02em]">
                  Stock pipeline
                </h2>
                <p className="mt-2 text-xs text-[var(--ink-faint)]">
                  Planned inventory stages.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[var(--line)] px-4">
              {pipeline.map((item) => (
                <div
                  key={item.label}
                  className="grid min-h-[58px] grid-cols-[12px_1fr_auto] items-center gap-2"
                >
                  <span
                    className={`size-1.5 ${
                      item.tone === "accent"
                        ? "bg-[var(--accent)]"
                        : item.tone === "neutral"
                          ? "bg-[var(--line-strong)]"
                          : "bg-[var(--line)]"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-xs text-[var(--ink-faint)]">
                      {item.detail}
                    </p>
                  </div>
                  <span className="data-value text-[18px] font-medium">—</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
