import type { User } from "@supabase/supabase-js";
import type { ThemePreference } from "@/types/database";

export type CurrentAccount = {
  user: User;
  profile: {
    displayName: string;
    firstName: string;
    lastName: string;
    businessName: string | null;
    themePreference: ThemePreference;
    acceptedTerms: true | null;
    completedOnboarding: string | null;
    onboardingCompleted: boolean;
    onboardingCompletedAt: string | null;
  } | null;
  membership: {
    workspaceId: string;
    role: "owner";
  } | null;
  workspace: {
    id: string;
    name: string;
    businessType: string | null;
    primaryCategory: string | null;
    sellingMarkets: string[] | null;
    experienceLevel: string | null;
    sellingChannels: string[] | null;
    countryCode: string;
    defaultCurrency: string;
    locale: string;
    timeZone: string;
  } | null;
};

export function isAccountComplete(account: CurrentAccount) {
  return Boolean(
    account.profile?.completedOnboarding ||
      // Legacy records completed before the authoritative timestamp column was
      // introduced remain complete without fabricating terms acceptance.
      account.profile?.onboardingCompleted === true,
  );
}

export function hasConsistentWorkspaceData(account: CurrentAccount) {
  return Boolean(
    account.membership?.role === "owner" &&
      account.workspace &&
      account.membership.workspaceId === account.workspace.id,
  );
}
