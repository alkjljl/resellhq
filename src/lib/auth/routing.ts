import {
  isAccountComplete,
  type CurrentAccount,
} from "@/lib/auth/account-state";
import { getSafeRedirect } from "@/lib/security/safe-redirect";

export type AccountState =
  | "unauthenticated"
  | "needs-onboarding"
  | "complete";

const protectedPrefixes = ["/dashboard", "/settings", "/onboarding"];

export function destinationForAccount(state: AccountState) {
  if (state === "unauthenticated") return "/login";
  return state === "complete" ? "/dashboard" : "/onboarding";
}

export function destinationAfterSignIn(
  account: CurrentAccount | null,
  requestedNext: string | null | undefined,
) {
  return account && isAccountComplete(account)
    ? getSafeRedirect(requestedNext, "/dashboard")
    : "/onboarding";
}

export function accountStateForAccount(
  account: CurrentAccount | null,
): AccountState {
  if (!account) return "unauthenticated";
  return isAccountComplete(account) ? "complete" : "needs-onboarding";
}

export async function resolveRootDestination(
  loadAccount: () => Promise<CurrentAccount | null>,
) {
  try {
    const state = accountStateForAccount(await loadAccount());
    return state === "unauthenticated" ? null : destinationForAccount(state);
  } catch {
    return null;
  }
}

export function canOpenOnboarding(state: AccountState) {
  return state === "needs-onboarding";
}

export function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
