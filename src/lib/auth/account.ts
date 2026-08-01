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
      "display_name, first_name, last_name, business_name, theme_preference, accepted_terms, completed_onboarding, onboarding_completed, onboarding_completed_at",
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
        "id, name, business_type, primary_category, selling_markets, experience_level, selling_channels, country_code, default_currency, locale, time_zone",
      )
      .eq("id", membership.workspace_id)
      .maybeSingle();

    if (error) throw new Error("Unable to load the workspace.");
    if (data) {
      workspace = {
        id: data.id,
        name: data.name,
        businessType: data.business_type,
        primaryCategory: data.primary_category,
        sellingMarkets: data.selling_markets,
        experienceLevel: data.experience_level,
        sellingChannels: data.selling_channels,
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
          firstName: profile.first_name ?? "",
          lastName: profile.last_name ?? "",
          businessName: profile.business_name,
          themePreference: profile.theme_preference,
          acceptedTerms: profile.accepted_terms,
          completedOnboarding: profile.completed_onboarding,
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
