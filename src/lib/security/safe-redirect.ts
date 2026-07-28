const allowedRoutes = [
  "/dashboard",
  "/onboarding",
  "/settings/profile",
  "/settings/business",
  "/settings/preferences",
  "/settings/security",
  "/reset-password",
] as const;

export function getSafeRedirect(
  candidate: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!candidate) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return fallback;
  }

  if (
    decoded !== candidate &&
    (/^[a-z][a-z\d+\-.]*:/i.test(decoded) || decoded.startsWith("//"))
  ) {
    return fallback;
  }

  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    candidate.includes("\0") ||
    /^[a-z][a-z\d+\-.]*:/i.test(candidate)
  ) {
    return fallback;
  }

  const path = candidate.split(/[?#]/, 1)[0];
  return allowedRoutes.includes(path as (typeof allowedRoutes)[number])
    ? candidate
    : fallback;
}
