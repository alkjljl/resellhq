import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TeamMembersSettings } from "@/features/settings/team-members";
import { formatLastActive } from "@/features/settings/team-members-model";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";

export const metadata: Metadata = { title: "Team members" };

export default async function TeamMembersSettingsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (!isAccountComplete(account)) redirect("/onboarding");
  if (!account.workspace || account.membership?.role !== "owner") {
    throw new Error("Completed account has inconsistent workspace data.");
  }

  const lastActive = formatLastActive(
    account.user.last_sign_in_at,
    account.workspace.timeZone,
  );

  return (
    <TeamMembersSettings
      workspaceName={account.workspace.name}
      member={{
        displayName: account.profile?.displayName.trim() || "Name not set",
        email: account.user.email ?? "Email unavailable",
        status: account.user.email_confirmed_at
          ? "Active"
          : "Verification pending",
        lastActiveAt: lastActive.at,
        lastActiveLabel: lastActive.label,
      }}
    />
  );
}
