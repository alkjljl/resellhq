const settingsLabels: Record<string, string> = {
  "/settings/profile": "Profile",
  "/settings/business": "Business",
  "/settings/preferences": "Preferences",
  "/settings/security": "Security",
  "/settings/team": "Team members",
};

export function applicationBreadcrumb(pathname: string) {
  if (pathname.startsWith("/settings")) {
    return {
      section: "Settings",
      page: settingsLabels[pathname] ?? "Settings",
    };
  }

  return { section: "Overview", page: "Dashboard" };
}
