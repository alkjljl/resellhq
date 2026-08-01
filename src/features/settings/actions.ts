"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions/state";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";
import { createClient } from "@/lib/supabase/server";
import {
  businessSchema,
  preferencesSchema,
  profileSchema,
} from "@/lib/validation/account";
import { buildUpdateBusinessSettingsArgs } from "./business-payload";

function invalid(
  fieldErrors: Record<string, string[] | undefined>,
): ActionState {
  return {
    status: "error",
    message: "Review the highlighted fields.",
    fieldErrors,
  };
}

async function requireAccount() {
  const account = await getCurrentAccount();
  return account && isAccountComplete(account) ? account : null;
}

export async function saveProfileAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);

  const account = await requireAccount();
  if (!account) {
    return { status: "error", message: "Your session is no longer valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", account.user.id);

  if (error) {
    return {
      status: "error",
      message: "Your profile could not be saved. Try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/profile");
  return { status: "success", message: "Profile saved." };
}

export async function saveBusinessAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = businessSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);

  const account = await requireAccount();
  if (!account?.workspace || account.membership?.role !== "owner") {
    return {
      status: "error",
      message: "Workspace-owner access is required to make this change.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc(
    "update_business_settings",
    buildUpdateBusinessSettingsArgs(parsed.data),
  );

  if (error) {
    return {
      status: "error",
      message: "Business settings could not be saved. Try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/business");
  return { status: "success", message: "Business settings saved." };
}

export async function savePreferencesAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = preferencesSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);

  const account = await requireAccount();
  if (!account) {
    return { status: "error", message: "Your session is no longer valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_preferences", {
    p_default_currency: parsed.data.defaultCurrency,
    p_locale: parsed.data.locale,
    p_time_zone: parsed.data.timeZone,
    p_theme_preference: parsed.data.themePreference,
  });

  if (error) {
    return {
      status: "error",
      message: "Preferences could not be saved. Try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/preferences");
  return { status: "success", message: "Preferences saved." };
}
