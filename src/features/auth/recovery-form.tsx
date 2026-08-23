"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { initialActionState } from "@/lib/actions/state";
import { forgotPasswordAction } from "@/features/auth/actions";

export function RecoveryForm() {
  const [state, action, pending] = useActionState(
    forgotPasswordAction,
    initialActionState,
  );
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormField
        id="email"
        label="Email address"
        error={state.fieldErrors?.email?.[0]}
      >
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
        />
      </FormField>
      {state.message ? (
        <Alert tone={state.status === "success" ? "success" : "error"}>
          {state.message}
        </Alert>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending link…" : "Send reset link"}
      </Button>
      <Link
        href="/login"
        className="flex min-h-11 items-center justify-center text-center text-sm font-semibold hover:underline"
      >
        Back to login
      </Link>
    </form>
  );
}
