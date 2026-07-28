import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { ResetForm } from "@/features/auth/reset-form";

export const metadata: Metadata = {
  title: "Choose new password",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Use a unique password that you do not use for another service."
    >
      <ResetForm />
    </AuthShell>
  );
}
