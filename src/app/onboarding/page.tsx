import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Brand } from "@/components/shared/brand";
import { ThemeMenu } from "@/components/shared/theme-menu";
import { OnboardingForm } from "@/features/onboarding/onboarding-form";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";

export const metadata: Metadata = {
  title: "Set up workspace",
};

export default async function OnboardingPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?next=/onboarding");
  if (isAccountComplete(account)) redirect("/dashboard");

  return (
    <main className="auth-canvas min-h-screen px-5 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <Brand />
          <ThemeMenu />
        </div>
        <div className="mx-auto mt-8 max-w-[620px] rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] sm:p-10">
          <OnboardingForm
            initialDisplayName={account.profile?.displayName ?? ""}
          />
        </div>
      </div>
    </main>
  );
}
