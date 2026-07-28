export type AccountState =
  | "unauthenticated"
  | "needs-onboarding"
  | "complete";

const protectedPrefixes = ["/dashboard", "/settings", "/onboarding"];

export function destinationForAccount(state: AccountState) {
  if (state === "unauthenticated") return "/login";
  return state === "complete" ? "/dashboard" : "/onboarding";
}

export function canOpenOnboarding(state: AccountState) {
  return state === "needs-onboarding";
}

export function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
