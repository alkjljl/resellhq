import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";
import { hasConsistentWorkspaceData } from "@/lib/auth/account-state";

export default async function ApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (!isAccountComplete(account)) redirect("/onboarding");
  if (!hasConsistentWorkspaceData(account) || !account.workspace) {
    throw new Error("Completed account has inconsistent workspace data.");
  }

  return (
    <AppShell
      email={account.user.email ?? "Signed in"}
      displayName={account.profile?.displayName || "ResellHQ operator"}
      workspaceName={account.workspace.name}
      themePreference={account.profile?.themePreference ?? "system"}
      userId={account.user.id}
    >
      {children}
    </AppShell>
  );
}
