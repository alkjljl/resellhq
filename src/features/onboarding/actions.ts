"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions/state";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation/account";

export async function completeOnboardingAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = onboardingSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the highlighted fields before continuing.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return {
      status: "error",
      message: "Your session expired. Log in and continue setup.",
    };
  }

  const { error } = await supabase.rpc("complete_onboarding", {
    p_display_name: parsed.data.displayName,
    p_workspace_name: parsed.data.workspaceName,
    p_business_type: parsed.data.businessType || null,
    p_country_code: parsed.data.countryCode,
    p_default_currency: parsed.data.defaultCurrency,
    p_locale: parsed.data.locale,
    p_time_zone: parsed.data.timeZone,
  });

  if (error) {
    return {
      status: "error",
      message:
        "We could not finish workspace setup. Your entries are still here; try again.",
    };
  }

  redirect("/dashboard?setup=complete");
}
