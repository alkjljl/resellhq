import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";
import { getSafeRedirect } from "@/lib/security/safe-redirect";

export const metadata: Metadata = {
  title: "Log in",
};

const errors: Record<string, string> = {
  oauth_unavailable: "Google sign-in is unavailable right now. Try again.",
  callback_failed:
    "That sign-in link is invalid or expired. Start the sign-in process again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
}) {
  const account = await getCurrentAccount();
  if (account) {
    redirect(isAccountComplete(account) ? "/dashboard" : "/onboarding");
  }

  const query = await searchParams;
  const next = getSafeRedirect(query.next, "/dashboard");

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your workspace and continue where you left off."
    >
      <AuthForm
        mode="login"
        next={next}
        pageError={query.error ? errors[query.error] : undefined}
      />
    </AuthShell>
  );
}
