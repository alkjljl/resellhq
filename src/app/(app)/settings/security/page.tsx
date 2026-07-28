import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { SettingsPanel } from "@/components/layout/settings-panel";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/logout-button";
import { getCurrentAccount } from "@/lib/auth/account";

export const metadata: Metadata = { title: "Security" };

export default async function SecuritySettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const query = await searchParams;

  const providers = Array.from(
    new Set(
      account.user.identities
        ?.map((identity) => identity.provider)
        .filter(Boolean) ?? [],
    ),
  );

  return (
    <div className="space-y-6">
      {query.error === "logout_failed" ? (
        <Alert>
          This session could not be ended. Refresh the page and try again.
        </Alert>
      ) : null}
      <SettingsPanel
        title="Authentication methods"
        description="Providers currently connected to your Supabase authentication identity."
      >
        <div className="space-y-3">
          {(providers.length > 0 ? providers : ["email"]).map((provider) => (
            <div
              key={provider}
              className="flex items-center gap-3 border-b border-[var(--line)] py-3 first:pt-0 last:border-0 last:pb-0"
            >
              <span className="grid size-9 place-items-center rounded-md bg-[var(--surface-subtle)] text-[var(--accent)]">
                <ShieldCheck className="size-[18px]" />
              </span>
              <div>
                <p className="text-sm font-semibold capitalize">{provider}</p>
                <p className="text-xs text-[var(--ink-muted)]">Connected</p>
              </div>
            </div>
          ))}
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Password and sessions"
        description="Use a recovery link to change your password, or end this session."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/forgot-password"
            className={buttonVariants({ variant: "secondary" })}
          >
            <KeyRound className="size-4" />
            Reset password
          </Link>
          <LogoutButton />
        </div>
        <p className="mt-5 border-t border-[var(--line)] pt-5 text-xs leading-5 text-[var(--ink-muted)]">
          Use a unique password and review Supabase authentication rate limits
          before launch. ResellHQ never stores account passwords in application
          tables.
        </p>
      </SettingsPanel>
    </div>
  );
}
