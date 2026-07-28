"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { initialActionState } from "@/lib/actions/state";
import { resetPasswordAction } from "@/features/auth/actions";

export function ResetForm() {
  const [state, action, pending] = useActionState(
    resetPasswordAction,
    initialActionState,
  );

  if (state.status === "success") {
    return (
      <div className="space-y-5">
        <Alert tone="success">{state.message}</Alert>
        <Link
          href="/dashboard"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-ink)]"
        >
          Continue to ResellHQ
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormField
        id="password"
        label="New password"
        description="Use at least 10 characters."
        error={state.fieldErrors?.password?.[0]}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : undefined
          }
        />
      </FormField>
      <FormField
        id="confirmPassword"
        label="Confirm new password"
        error={state.fieldErrors?.confirmPassword?.[0]}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          aria-describedby={
            state.fieldErrors?.confirmPassword
              ? "confirmPassword-error"
              : undefined
          }
        />
      </FormField>
      {state.message ? <Alert>{state.message}</Alert> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Updating password…" : "Update password"}
      </Button>
    </form>
  );
}
