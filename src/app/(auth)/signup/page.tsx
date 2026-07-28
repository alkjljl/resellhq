import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignupPage() {
  const account = await getCurrentAccount();
  if (account) {
    redirect(isAccountComplete(account) ? "/dashboard" : "/onboarding");
  }

  return (
    <AuthShell
      title="Create your account"
      description="Start with a secure account, then set up your business workspace."
    >
      <AuthForm mode="signup" next="/onboarding" />
    </AuthShell>
  );
}
