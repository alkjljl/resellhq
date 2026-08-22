import { expect, test } from "@playwright/test";
import {
  BrowserFixtures,
  fillOnboarding,
  getLatestMailLink,
  loginViaUi,
} from "./support.mjs";

test.describe.serial("Phase 1 browser acceptance", () => {
  let fixtures;

  test.beforeAll(() => {
    fixtures = new BrowserFixtures();
  });

  test.afterAll(async () => {
    await fixtures.cleanup();
  });

  test("signed-out public and protected routing fails closed", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Run the business behind every resale." }),
    ).toBeVisible();
    await expect(page.getByLabel("Workspace")).toHaveCount(0);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
    await page.goto("/settings/business");
    await expect(page).toHaveURL(/\/login\?next=%2Fsettings%2Fbusiness$/);
  });

  test("signup validates fields and creates a real local Auth session", async ({ page }) => {
    const suffix = crypto.randomUUID();
    const email = `phase1-ui-signup-${suffix}@example.invalid`;
    const password = `Phase1!${suffix}`;
    await page.goto("/signup");
    await page.getByLabel("Email address").fill("invalid");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByLabel("Confirm password").fill("different");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();

    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await fixtures.registerSignedUpEmail(email);
    await expect(page.getByLabel("Business name (optional)")).toBeVisible();
  });

  test("login rejects a wrong password and preserves a legitimate session", async ({ page }) => {
    const user = await fixtures.createUser("login", { completed: true });
    await page.goto("/login");
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill(`${user.password}-wrong`);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("The email or password is incorrect. Try again.")).toBeVisible();

    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Your resale desk" })).toBeVisible();

    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Run the business behind every resale." }),
    ).toHaveCount(0);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("incomplete users cannot bypass onboarding with a next path", async ({ page }) => {
    const user = await fixtures.createUser("incomplete-route");
    await page.goto("/login?next=/settings/business");
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/onboarding$/);
  });

  test("forged sessions fail closed and external next destinations are ignored", async ({ page }) => {
    const user = await fixtures.createUser("invalid-session", { completed: true });
    await page.goto("/login?next=https://example.com/escape");
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(
      (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
    );
    expect(authCookies.length).toBeGreaterThan(0);
    await page.context().clearCookies();
    await page.context().addCookies(
      authCookies.map((cookie) => ({ ...cookie, value: "invalid-session" })),
    );
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });

  for (const [label, businessName, storedName] of [
    ["without a business name", "", null],
    ["with a trimmed business name", "  Northline Browser  ", "Northline Browser"],
  ]) {
    test(`completes onboarding ${label}`, async ({ page }) => {
      const user = await fixtures.createUser(`onboarding-${label.replaceAll(" ", "-")}`);
      await loginViaUi(page, user);

      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page.getByText("Enter your name.").first()).toBeVisible();
      await fillOnboarding(page, businessName);
      const terms = page.getByRole("checkbox", { name: /I have read and accept/ });
      await expect(terms).not.toBeChecked();
      await page.getByRole("button", { name: "Finish setup" }).click();
      await expect(page.getByText("Accept the Terms and Privacy Notice.")).toBeVisible();
      await terms.check();
      await page.getByRole("button", { name: "Finish setup" }).click();
      await expect(page).toHaveURL(/\/dashboard\?setup=complete$/);
      await fixtures.trackWorkspaceForUser(user.id);

      const { data: profile } = await fixtures.admin
        .from("profiles")
        .select("business_name,accepted_terms,completed_onboarding")
        .eq("id", user.id)
        .single();
      const { data: membership } = await fixtures.admin
        .from("workspace_memberships")
        .select("workspace_id")
        .eq("user_id", user.id)
        .single();
      const { data: workspace } = await fixtures.admin
        .from("workspaces")
        .select("selling_markets,selling_channels")
        .eq("id", membership.workspace_id)
        .single();
      expect(profile).toMatchObject({
        business_name: storedName,
        accepted_terms: true,
      });
      expect(profile.completed_onboarding).toBeTruthy();
      expect(workspace.selling_markets).toEqual(["CA", "US"]);
      expect(workspace.selling_channels).toEqual(["eBay"]);

      await page.reload();
      await expect(page.getByRole("heading", { name: "Your resale desk" })).toBeVisible();
      await page.goto("/onboarding");
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  }

  test("business settings persist additions, changes, and removal", async ({ page }) => {
    const user = await fixtures.createUser("business-browser", {
      completed: true,
      businessName: "Initial Browser Business",
    });
    const { data: before } = await fixtures.admin
      .from("profiles")
      .select("completed_onboarding")
      .eq("id", user.id)
      .single();
    await loginViaUi(page, user, /\/dashboard$/);
    await page.goto("/settings/business");
    const businessName = page.getByLabel("Business name (optional)");
    const workspaceName = page.getByLabel("Workspace or store name");
    await expect(businessName).toHaveValue("Initial Browser Business");
    const originalWorkspaceName = await workspaceName.inputValue();

    for (const value of ["Added Browser Business", "Changed Browser Business", ""]) {
      await businessName.fill(value);
      await page.getByRole("button", { name: "Save business settings" }).click();
      await expect(page.getByText("Business settings saved.")).toBeVisible();
      await page.reload();
      await expect(businessName).toHaveValue(value);
      await expect(workspaceName).toHaveValue(originalWorkspaceName);
    }
    await expect(page).toHaveURL(/\/settings\/business$/);

    const { data: after } = await fixtures.admin
      .from("profiles")
      .select("business_name,completed_onboarding")
      .eq("id", user.id)
      .single();
    expect(after.business_name).toBeNull();
    expect(after.completed_onboarding).toBe(before.completed_onboarding);
  });

  test("logout clears the browser session and protected access", async ({ page }) => {
    const user = await fixtures.createUser("logout", { completed: true });
    await loginViaUi(page, user, /\/dashboard$/);
    await page.getByRole("button", { name: /Open account menu/ }).click();
    const logout = page.getByRole("button", { name: "Log out" });
    await logout.click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("device-local Activity preferences affect the panel and survive reload", async ({ page }) => {
    const user = await fixtures.createUser("activity-preferences", { completed: true });
    await loginViaUi(page, user, /\/dashboard$/);
    await page.getByRole("button", { name: /Activity,/ }).click();
    await page.getByRole("link", { name: "Manage" }).click();
    await expect(page).toHaveURL(/\/settings\/preferences#activity$/);
    await page.getByLabel("Default view").selectOption("tasks");
    const unreadFirst = page.getByRole("switch", {
      name: "Show unread activity first",
    });
    await unreadFirst.click();
    await expect(page.getByText("Saved on this device")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Default view")).toHaveValue("tasks");
    await expect(unreadFirst).toBeChecked();

    await page.goto("/dashboard");
    await page.getByRole("button", { name: /Activity,/ }).click();
    await expect(page.getByRole("tab", { name: /Tasks/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("password recovery uses captured local email and changes the password", async ({ page }) => {
    const user = await fixtures.createUser("password-recovery");
    const newPassword = `Updated!${crypto.randomUUID()}`;
    await page.goto("/forgot-password");
    await page.getByLabel("Email address").fill(user.email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(
      page.getByText("If an account exists for that email, a password reset link is on its way."),
    ).toBeVisible();

    const recoveryLink = await getLatestMailLink(user.email, "recovery");
    await page.goto(recoveryLink);
    await expect(page).toHaveURL(/\/reset-password$/);
    await page.getByLabel("New password").fill(newPassword);
    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Password changed. You can return to your workspace.")).toBeVisible();

    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("The email or password is incorrect. Try again.")).toBeVisible();
    await page.getByLabel("Password").fill(newPassword);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    user.password = newPassword;
  });
});
