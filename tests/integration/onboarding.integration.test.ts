import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SupabaseFixtureManager,
  type TestUser,
  validOnboardingArgs,
} from "../support/supabase-fixtures";

describe.sequential("real onboarding persistence", () => {
  let fixtures: SupabaseFixtureManager;

  beforeAll(() => {
    fixtures = new SupabaseFixtureManager();
  });

  afterAll(async () => {
    if (fixtures) await fixtures.cleanup();
  });

  it.each([
    ["omitted", undefined],
    ["empty", ""],
    ["whitespace", "   "],
  ])("persists an %s business name as null", async (label, businessName) => {
    const user = await fixtures.createUser(`business-${label}`);
    const request = { ...validOnboardingArgs } as Record<string, unknown>;
    if (businessName === undefined) delete request.p_business_name;
    else request.p_business_name = businessName;
    const response = await rawOnboardingRequest(fixtures, user, request);
    expect(response.ok).toBe(true);
    const workspaceId = (await response.json()) as string;
    fixtures.trackWorkspace(workspaceId);
    const fresh = await fixtures.freshClient(user);
    const { data: profile, error: profileError } = await fresh
      .from("profiles")
      .select(
        "first_name,last_name,business_name,accepted_terms,completed_onboarding",
      )
      .eq("id", user.id)
      .single();
    const { data: workspace, error: workspaceError } = await fresh
      .from("workspaces")
      .select(
        "name,business_type,primary_category,country_code,default_currency,selling_markets,experience_level,selling_channels",
      )
      .eq("id", workspaceId)
      .single();

    expect(profileError).toBeNull();
    expect(workspaceError).toBeNull();
    expect(profile).toMatchObject({
      first_name: "Avery",
      last_name: "Chen",
      business_name: null,
      accepted_terms: true,
    });
    expect(profile?.completed_onboarding).toBeTruthy();
    expect(workspace).toEqual({
      name: "My workspace",
      business_type: "Independent reseller",
      primary_category: "Clothing & accessories",
      country_code: "CA",
      default_currency: "CAD",
      selling_markets: ["CA", "US"],
      experience_level: "1-3 years",
      selling_channels: ["eBay", "Vinted"],
    });
    expect(profile?.business_name).not.toBe(workspace?.name);
  });

  it("trims and reloads a provided business name", async () => {
    const user = await fixtures.createUser("trimmed-business");
    await fixtures.completeOnboarding(user, {
      p_business_name: "  Northline Resale  ",
    });
    const fresh = await fixtures.freshClient(user);
    const { data, error } = await fresh
      .from("profiles")
      .select("business_name")
      .eq("id", user.id)
      .single();

    expect(error).toBeNull();
    expect(data?.business_name).toBe("Northline Resale");
  });

  it.each([
    ["missing", undefined],
    ["false", false],
    ["null", null],
    ["string true", "true"],
    ["string false", "false"],
    ["number one", 1],
    ["empty string", ""],
    ["truthy string", "accepted"],
    ["malformed object", { accepted: true }],
  ])(
    "rejects %s consent at the real RPC boundary without partial persistence",
    async (label, consent) => {
      const user = await fixtures.createUser(`consent-${label.replaceAll(" ", "-")}`);
      const { count: beforeWorkspaceCount } = await fixtures.admin
        .from("workspaces")
        .select("id", { count: "exact", head: true });
      const payload: Record<string, unknown> = {
        ...validOnboardingArgs,
        p_accepted_terms: consent,
      };
      if (consent === undefined) delete payload.p_accepted_terms;

      const response = await rawOnboardingRequest(fixtures, user, payload);
      expect(response.ok).toBe(false);

      const { data: profile } = await fixtures.admin
        .from("profiles")
        .select("accepted_terms,completed_onboarding")
        .eq("id", user.id)
        .single();
      const { count: membershipCount } = await fixtures.admin
        .from("workspace_memberships")
        .select("workspace_id", { count: "exact", head: true })
        .eq("user_id", user.id);
      const { count: afterWorkspaceCount } = await fixtures.admin
        .from("workspaces")
        .select("id", { count: "exact", head: true });

      expect(profile).toEqual({
        accepted_terms: null,
        completed_onboarding: null,
      });
      expect(membershipCount).toBe(0);
      expect(afterWorkspaceCount).toBe(beforeWorkspaceCount);
    },
  );

  it("accepts exact boolean true after a failed request", async () => {
    const user = await fixtures.createUser("consent-retry");
    const failed = await rawOnboardingRequest(fixtures, user, {
      ...validOnboardingArgs,
      p_first_name: "",
      p_accepted_terms: true,
    });
    expect(failed.ok).toBe(false);

    const workspaceId = await fixtures.completeOnboarding(user);
    const { data: profile } = await fixtures.admin
      .from("profiles")
      .select("accepted_terms,completed_onboarding")
      .eq("id", user.id)
      .single();
    const { count: membershipCount } = await fixtures.admin
      .from("workspace_memberships")
      .select("workspace_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId);

    expect(profile?.accepted_terms).toBe(true);
    expect(profile?.completed_onboarding).toBeTruthy();
    expect(membershipCount).toBe(1);
  });

  it("converges repeated submissions on one workspace and first timestamp", async () => {
    const user = await fixtures.createUser("idempotent");
    const firstWorkspaceId = await fixtures.completeOnboarding(user);
    const { data: firstProfile } = await fixtures.admin
      .from("profiles")
      .select("completed_onboarding")
      .eq("id", user.id)
      .single();
    const { error: renameError } = await user.client
      .from("workspaces")
      .update({ name: "Custom workspace" })
      .eq("id", firstWorkspaceId);
    expect(renameError).toBeNull();

    const secondWorkspaceId = await fixtures.completeOnboarding(user);
    const { data: secondProfile } = await fixtures.admin
      .from("profiles")
      .select("completed_onboarding")
      .eq("id", user.id)
      .single();
    const { data: workspace } = await fixtures.admin
      .from("workspaces")
      .select("name,selling_markets,selling_channels")
      .eq("id", firstWorkspaceId)
      .single();
    const { count: profileCount } = await fixtures.admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("id", user.id);
    const { count: membershipCount } = await fixtures.admin
      .from("workspace_memberships")
      .select("workspace_id", { count: "exact", head: true })
      .eq("user_id", user.id);

    expect(secondWorkspaceId).toBe(firstWorkspaceId);
    expect(secondProfile?.completed_onboarding).toBe(
      firstProfile?.completed_onboarding,
    );
    expect(workspace).toEqual({
      name: "Custom workspace",
      selling_markets: ["CA", "US"],
      selling_channels: ["eBay", "Vinted"],
    });
    expect(profileCount).toBe(1);
    expect(membershipCount).toBe(1);
  });
});

async function rawOnboardingRequest(
  fixtures: SupabaseFixtureManager,
  user: TestUser,
  payload: Record<string, unknown>,
) {
  const { data } = await user.client.auth.getSession();
  if (!data.session) throw new Error("Test session is unavailable.");

  return fetch(
    `${fixtures.environment.url}/rest/v1/rpc/complete_onboarding`,
    {
      method: "POST",
      headers: {
        apikey: fixtures.environment.publishableKey,
        authorization: `Bearer ${data.session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}
