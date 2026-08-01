import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsPanel } from "@/components/layout/settings-panel";
import { BusinessSettingsForm } from "@/features/settings/settings-forms";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";
import { BUSINESS_TYPES } from "@/lib/constants/international";

export const metadata: Metadata = { title: "Business settings" };

export default async function BusinessSettingsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (!isAccountComplete(account)) redirect("/onboarding");
  if (!account.workspace) {
    throw new Error("Completed account has inconsistent workspace data.");
  }
  const businessType = BUSINESS_TYPES.find(
    (type) => type === account.workspace?.businessType,
  );

  return (
    <SettingsPanel
      title="Business workspace"
      description="Shared operating identity and country configuration for this workspace."
    >
      <BusinessSettingsForm
        defaults={{
          workspaceName: account.workspace.name,
          businessName: account.profile?.businessName ?? "",
          businessType: businessType ?? "",
          countryCode: account.workspace.countryCode,
        }}
      />
    </SettingsPanel>
  );
}
