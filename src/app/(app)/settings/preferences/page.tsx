import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsPanel } from "@/components/layout/settings-panel";
import { ActivityPreferencesSection } from "@/features/notifications/activity-preferences";
import { PreferencesSettingsForm } from "@/features/settings/settings-forms";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";

export const metadata: Metadata = { title: "Preferences" };

export default async function PreferencesSettingsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (!isAccountComplete(account)) redirect("/onboarding");
  if (!account.workspace) {
    throw new Error("Completed account has inconsistent workspace data.");
  }

  return (
    <div className="space-y-6">
      <SettingsPanel
        title="Regional preferences"
        description="Canonical defaults for future currency, dates, language, and time-sensitive records."
      >
        <PreferencesSettingsForm
          defaults={{
            defaultCurrency: account.workspace.defaultCurrency,
            locale: account.workspace.locale,
            timeZone: account.workspace.timeZone,
            themePreference: account.profile?.themePreference ?? "system",
          }}
        />
      </SettingsPanel>
      <ActivityPreferencesSection userId={account.user.id} />
    </div>
  );
}
