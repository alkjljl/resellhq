import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect } from "@playwright/test";
import { capturePlaywrightTestEnvironment } from "../../scripts/acceptance/test-environment.mjs";

// Discovery retains the credential so independently spawned workers can inherit
// it. Each worker captures and removes its own copy before launching browsers.
export const testEnvironment = capturePlaywrightTestEnvironment();

export class BrowserFixtures {
  constructor() {
    this.admin = createClient(testEnvironment.url, testEnvironment.secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.userIds = new Set();
    this.workspaceIds = new Set();
  }

  async createUser(label, { completed = false, businessName = null } = {}) {
    const suffix = randomUUID();
    const email = `phase1-browser-${label}-${suffix}@example.invalid`;
    const password = `Phase1!${suffix}`;
    const { data, error } = await this.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Browser user creation failed (${error?.code ?? "unknown"}).`);
    }
    this.userIds.add(data.user.id);
    const user = { id: data.user.id, email, password };
    if (completed) await this.completeOnboarding(user, { businessName });
    return user;
  }

  async registerSignedUpEmail(email) {
    const { data, error } = await this.admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) throw new Error(`Test signup lookup failed (${error.code}).`);
    const user = data.users.find((candidate) => candidate.email === email);
    if (!user) throw new Error("The browser-created test user was not found.");
    this.userIds.add(user.id);
    return user.id;
  }

  async authenticatedClient(user) {
    const client = createClient(
      testEnvironment.url,
      testEnvironment.publishableKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await client.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    if (error) throw new Error(`Test user sign-in failed (${error.code}).`);
    return client;
  }

  async completeOnboarding(user, { businessName = null } = {}) {
    const client = await this.authenticatedClient(user);
    const { data, error } = await client.rpc("complete_onboarding", {
      p_first_name: "Browser",
      p_last_name: "Tester",
      p_business_name: businessName,
      p_business_type: "Independent reseller",
      p_primary_category: "Clothing & accessories",
      p_country_code: "CA",
      p_default_currency: "CAD",
      p_selling_markets: ["CA"],
      p_experience_level: "1-3 years",
      p_selling_channels: ["eBay"],
      p_accepted_terms: true,
      p_locale: "en-CA",
      p_time_zone: "America/Toronto",
    });
    if (error || !data) {
      throw new Error(`Browser onboarding fixture failed (${error?.code ?? "unknown"}).`);
    }
    this.workspaceIds.add(data);
    return data;
  }

  async trackWorkspaceForUser(userId) {
    const { data } = await this.admin
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("user_id", userId);
    data?.forEach((row) => this.workspaceIds.add(row.workspace_id));
  }

  async cleanup() {
    assertCapturedEnvironmentIsIsolated();
    for (const userId of this.userIds) await this.trackWorkspaceForUser(userId);
    for (const userId of this.userIds) {
      const { error } = await this.admin
        .from("workspace_memberships")
        .delete()
        .eq("user_id", userId);
      if (error) throw new Error(`Browser membership cleanup failed (${error.code}).`);
    }
    for (const workspaceId of this.workspaceIds) {
      const { error } = await this.admin
        .from("workspaces")
        .delete()
        .eq("id", workspaceId);
      if (error) throw new Error(`Browser workspace cleanup failed (${error.code}).`);
    }
    for (const userId of this.userIds) {
      const { error } = await this.admin.auth.admin.deleteUser(userId);
      if (error) throw new Error(`Browser auth cleanup failed (${error.code}).`);
    }
  }
}

function assertCapturedEnvironmentIsIsolated() {
  if (testEnvironment.projectRef === "fyosviaioflewfqcdkmx") {
    throw new Error("Refusing browser-fixture cleanup against the main project.");
  }
  if (
    testEnvironment.confirmation !==
    `I_CONFIRM_ISOLATED_${testEnvironment.projectRef}`
  ) {
    throw new Error("The captured browser-test isolation guard is invalid.");
  }
  const hostname = new URL(testEnvironment.url).hostname;
  const isLoopback = new Set(["127.0.0.1", "localhost", "::1"]).has(hostname);
  if (testEnvironment.target === "local" ? !isLoopback : isLoopback) {
    throw new Error("The captured browser-test target classification is invalid.");
  }
}

export async function loginViaUi(page, user, expectedPath = /\/onboarding/) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(expectedPath);
}

export async function fillOnboarding(page, businessName = "") {
  await expect(page.getByLabel("Business name (optional)")).toBeVisible();
  await page.getByLabel("First name").fill("Avery");
  await page.getByLabel("Last name").fill("Chen");
  await page.getByLabel("Business name (optional)").fill(businessName);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Business type").selectOption("Independent reseller");
  await page.getByLabel("Primary category").selectOption("Clothing & accessories");
  await page.getByLabel("Experience level").selectOption("1-3 years");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Country").selectOption("CA");
  await page.getByLabel("Currency").selectOption("CAD");
  await page.getByLabel("Selling markets").selectOption(["CA", "US"]);
  await page.getByLabel("eBay").check();
  await page.getByRole("button", { name: "Continue" }).click();
}

export async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
}

export async function getLatestMailLink(email, type) {
  if (!testEnvironment.mailpitUrl) {
    throw new Error("Mailpit is unavailable in the isolated test environment.");
  }
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const response = await fetch(`${testEnvironment.mailpitUrl}/api/v1/messages`);
    if (response.ok) {
      const payload = await response.json();
      const message = payload.messages?.find((candidate) =>
        candidate.To?.some((recipient) => recipient.Address === email),
      );
      if (message) {
        const detailResponse = await fetch(
          `${testEnvironment.mailpitUrl}/api/v1/message/${message.ID}`,
        );
        const detail = await detailResponse.json();
        const content = `${detail.Text ?? ""}\n${detail.HTML ?? ""}`.replaceAll(
          "&amp;",
          "&",
        );
        const links = content.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
        const link = links.find((candidate) => candidate.includes(`type=${type}`));
        if (link) return link;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Mailpit did not capture a ${type} link for the test user.`);
}
