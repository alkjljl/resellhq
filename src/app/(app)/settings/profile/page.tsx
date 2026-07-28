import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsPanel } from "@/components/layout/settings-panel";
import { ProfileSettingsForm } from "@/features/settings/settings-forms";
import { getCurrentAccount } from "@/lib/auth/account";

export const metadata: Metadata = { title: "Profile settings" };

export default async function ProfileSettingsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  return (
    <SettingsPanel
      title="Profile"
      description="Your personal identity within every workspace you can access."
    >
      <ProfileSettingsForm
        displayName={account.profile?.displayName ?? ""}
        email={account.user.email ?? ""}
      />
    </SettingsPanel>
  );
}
