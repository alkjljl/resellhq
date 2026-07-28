"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { initialActionState } from "@/lib/actions/state";
import {
  googleOAuthAction,
  loginAction,
  signupAction,
} from "@/features/auth/actions";

export function AuthForm({
  mode,
  next = "/dashboard",
  pageError,
}: {
  mode: "login" | "signup";
  next?: string;
  pageError?: string;
}) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialActionState,
  );

  return (
    <div>
      {pageError ? <Alert className="mb-5">{pageError}</Alert> : null}
      <form action={googleOAuthAction}>
        <input type="hidden" name="next" value={next} />
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={pending}
        >
          <span className="text-base font-bold" aria-hidden="true">
            G
          </span>
          Continue with Google
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.08em] text-[var(--ink-faint)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        or
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <form action={formAction} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />
        <FormField
          id="email"
          label="Email address"
          error={state.fieldErrors?.email?.[0]}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={
              state.fieldErrors?.email ? "email-error" : undefined
            }
          />
        </FormField>
        <FormField
          id="password"
          label="Password"
          description={
            mode === "signup"
              ? "Use at least 10 characters."
              : undefined
          }
          error={state.fieldErrors?.password?.[0]}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={
              state.fieldErrors?.password ? "password-error" : undefined
            }
          />
        </FormField>
        {mode === "signup" ? (
          <FormField
            id="confirmPassword"
            label="Confirm password"
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
        ) : null}

        {state.message ? (
          <Alert tone={state.status === "success" ? "success" : "error"}>
            {state.message}
          </Alert>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending
            ? "Please wait…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </Button>
      </form>

      <div className="mt-6 flex flex-col gap-3 text-center text-sm text-[var(--ink-muted)]">
        {mode === "login" ? (
          <>
            <Link href="/forgot-password" className="font-medium hover:underline">
              Forgot your password?
            </Link>
            <p>
              New to ResellHQ?{" "}
              <Link href="/signup" className="font-semibold text-[var(--ink)] hover:underline">
                Create an account
              </Link>
            </p>
          </>
        ) : (
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--ink)] hover:underline">
              Log in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
