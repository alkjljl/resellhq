"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";
import { getRequestOrigin } from "@/lib/auth/request-origin";
import type { ActionState } from "@/lib/actions/state";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validation/auth";

function fields(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function validationError(
  message: string,
  fieldErrors: Record<string, string[] | undefined>,
): ActionState {
  return { status: "error", message, fieldErrors };
}

export async function loginAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(fields(formData));
  if (!parsed.success) {
    return validationError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      status: "error",
      message: "The email or password is incorrect. Try again.",
    };
  }

  const account = await getCurrentAccount();
  redirect(account && isAccountComplete(account) ? "/dashboard" : "/onboarding");
}

export async function signupAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signupSchema.safeParse(fields(formData));
  if (!parsed.success) {
    return validationError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        "/onboarding",
      )}`,
    },
  });

  if (error) {
    return {
      status: "error",
      message: "We could not create the account. Please try again.",
    };
  }

  if (data.session) redirect("/onboarding");

  return {
    status: "success",
    message:
      "Check your inbox to confirm your email. You can close this page after opening the link.",
  };
}

export async function googleOAuthAction() {
  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        "/dashboard",
      )}`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_unavailable");
  }
  redirect(data.url);
}

export async function forgotPasswordAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(fields(formData));
  if (!parsed.success) {
    return validationError(
      "Enter a valid email address.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        "/reset-password",
      )}`,
    },
  );

  if (error) {
    return {
      status: "error",
      message: "We could not send a reset link right now. Try again shortly.",
    };
  }

  return {
    status: "success",
    message:
      "If an account exists for that email, a password reset link is on its way.",
  };
}

export async function resetPasswordAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(fields(formData));
  if (!parsed.success) {
    return validationError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      status: "error",
      message: "This reset session has expired. Request a new link.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return {
      status: "error",
      message: "We could not update the password. Request a new reset link.",
    };
  }

  return {
    status: "success",
    message: "Password changed. You can return to your workspace.",
  };
}
