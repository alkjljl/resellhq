import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsPanel } from "@/components/layout/settings-panel";
import { BusinessSettingsForm } from "@/features/settings/settings-forms";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";

export const metadata: Metadata = { title: "Business settings" };

export default async function BusinessSettingsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (!isAccountComplete(account)) redirect("/onboarding");
  if (!account.workspace) {
    throw new Error("Completed account has inconsistent workspace data.");
  }

  return (
    <SettingsPanel
      title="Business workspace"
      description="Shared operating identity and country configuration for this workspace."
    >
      <BusinessSettingsForm
        defaults={{
          workspaceName: account.workspace.name,
          businessType: account.workspace.businessType ?? "",
          countryCode: account.workspace.countryCode,
        }}
      />
    </SettingsPanel>
  );
}
