import type { User } from "@supabase/supabase-js";
import type { ThemePreference } from "@/types/database";

export type CurrentAccount = {
  user: User;
  profile: {
    displayName: string;
    themePreference: ThemePreference;
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
    countryCode: string;
    defaultCurrency: string;
    locale: string;
    timeZone: string;
  } | null;
};

export function isAccountComplete(account: CurrentAccount) {
  return account.profile?.onboardingCompleted === true;
}

export function hasConsistentWorkspaceData(account: CurrentAccount) {
  return Boolean(
    account.membership?.role === "owner" &&
      account.workspace &&
      account.membership.workspaceId === account.workspace.id,
  );
}
