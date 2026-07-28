import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { RecoveryForm } from "@/features/auth/recovery-form";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Enter your account email and we will send a secure recovery link."
    >
      <RecoveryForm />
    </AuthShell>
  );
}
