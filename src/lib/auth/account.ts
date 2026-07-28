import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CurrentAccount } from "@/lib/auth/account-state";
export { isAccountComplete } from "@/lib/auth/account-state";

export const getCurrentAccount = cache(async (): Promise<CurrentAccount | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "display_name, theme_preference, onboarding_completed, onboarding_completed_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error("Unable to load the account profile.");

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_memberships")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (membershipError) {
    throw new Error("Unable to load the workspace membership.");
  }

  let workspace: CurrentAccount["workspace"] = null;
  if (membership) {
    const { data, error } = await supabase
      .from("workspaces")
      .select(
        "id, name, business_type, country_code, default_currency, locale, time_zone",
      )
      .eq("id", membership.workspace_id)
      .maybeSingle();

    if (error) throw new Error("Unable to load the workspace.");
    if (data) {
      workspace = {
        id: data.id,
        name: data.name,
        businessType: data.business_type,
        countryCode: data.country_code,
        defaultCurrency: data.default_currency,
        locale: data.locale,
        timeZone: data.time_zone,
      };
    }
  }

  return {
    user,
    profile: profile
      ? {
          displayName: profile.display_name ?? "",
          themePreference: profile.theme_preference,
          onboardingCompleted: profile.onboarding_completed,
          onboardingCompletedAt: profile.onboarding_completed_at,
        }
      : null,
    membership: membership
      ? { workspaceId: membership.workspace_id, role: membership.role }
      : null,
    workspace,
  };
});
