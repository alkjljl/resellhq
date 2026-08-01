"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions/state";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation/account";
import {
  buildCompleteOnboardingArgs,
  decodeOnboardingFormData,
} from "./onboarding-payload";

export async function completeOnboardingAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = onboardingSchema.safeParse(
    decodeOnboardingFormData(formData),
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

  const { error } = await supabase.rpc(
    "complete_onboarding",
    buildCompleteOnboardingArgs(parsed.data),
  );

  if (error) {
    return {
      status: "error",
      message:
        "We could not finish workspace setup. Your entries are still here; try again.",
    };
  }

  redirect("/dashboard?setup=complete");
}
