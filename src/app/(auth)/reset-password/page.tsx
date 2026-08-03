import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";
import { ResetForm } from "@/features/auth/reset-form";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { hasRecoveryAssurance } from "@/lib/auth/recovery-assurance";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Choose new password",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const canResetPassword =
    !error && hasRecoveryAssurance(data?.claims);

  return (
    <AuthShell
      title="Choose a new password"
      description="Use a unique password that you do not use for another service."
    >
      {canResetPassword ? (
        <ResetForm />
      ) : (
        <div className="space-y-5">
          <Alert>
            This password reset link is invalid or has expired. Request a new
            link to continue.
          </Alert>
          <Link
            href="/forgot-password"
            className={`${buttonVariants()} w-full`}
          >
            Request a new reset link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
