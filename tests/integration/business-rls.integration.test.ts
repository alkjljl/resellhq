import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  SupabaseFixtureManager,
  type TestUser,
} from "../support/supabase-fixtures";

describe.sequential("real business-settings persistence", () => {
  let fixtures: SupabaseFixtureManager;

  beforeAll(() => {
    fixtures = new SupabaseFixtureManager();
  });

  afterAll(async () => {
    if (fixtures) await fixtures.cleanup();
  });

  it("adds, changes, and removes a business name without changing completion", async () => {
    const user = await fixtures.createUser("business-settings");
    const workspaceId = await fixtures.completeOnboarding(user);
    const initial = await readAccountState(fixtures.admin, user.id, workspaceId);

    await updateBusiness(user, "Internal workspace", "Northline", "CA");
    expect(
      await readAccountState(await fixtures.freshClient(user), user.id, workspaceId),
    ).toMatchObject({
      profile: { business_name: "Northline" },
      workspace: { name: "Internal workspace" },
    });

    await updateBusiness(user, "Internal workspace", "Second Market", "US");
    expect(
      await readAccountState(await fixtures.freshClient(user), user.id, workspaceId),
    ).toMatchObject({
      profile: { business_name: "Second Market" },
      workspace: { name: "Internal workspace", country_code: "US" },
    });

    await updateBusiness(user, "Internal workspace", "   ", "US");
    const final = await readAccountState(
      await fixtures.freshClient(user),
      user.id,
      workspaceId,
    );
    expect(final.profile.business_name).toBeNull();
    expect(final.profile.completed_onboarding).toBe(
      initial.profile.completed_onboarding,
    );
    expect(final.workspace.name).toBe("Internal workspace");
  });

  it("cannot update another account and rejects anonymous settings calls", async () => {
    const userA = await fixtures.createUser("business-owner-a");
    const userB = await fixtures.createUser("business-owner-b");
    const workspaceA = await fixtures.completeOnboarding(userA, {
      p_business_name: "Business A",
    });
    const workspaceB = await fixtures.completeOnboarding(userB, {
      p_business_name: "Business B",
    });

    await updateBusiness(userA, "Workspace A", "Updated A", "CA");
    await userA.client
      .from("profiles")
      .update({ business_name: "Compromised" })
      .eq("id", userB.id);

    const anonymousResponse = await rawRpc(
      fixtures,
      fixtures.anonymous,
      "update_business_settings",
      {
        p_workspace_name: "Anonymous",
        p_business_name: "Anonymous",
        p_business_type: "Independent reseller",
        p_country_code: "CA",
      },
    );
    expect(anonymousResponse.ok).toBe(false);

    const stateA = await readAccountState(
      fixtures.admin,
      userA.id,
      workspaceA,
    );
    const stateB = await readAccountState(
      fixtures.admin,
      userB.id,
      workspaceB,
    );
    expect(stateA.profile.business_name).toBe("Updated A");
    expect(stateB.profile.business_name).toBe("Business B");
    expect(stateB.workspace.name).toBe("My workspace");
  });
});

describe.sequential("real two-user workspace isolation", () => {
  let fixtures: SupabaseFixtureManager;
  let userA: TestUser;
  let userB: TestUser;
  let workspaceA: string;
  let workspaceB: string;

  beforeAll(async () => {
    fixtures = new SupabaseFixtureManager();
    userA = await fixtures.createUser("rls-a");
    userB = await fixtures.createUser("rls-b");
    workspaceA = await fixtures.completeOnboarding(userA, {
      p_business_name: "RLS A",
    });
    workspaceB = await fixtures.completeOnboarding(userB, {
      p_business_name: "RLS B",
    });
  });

  afterAll(async () => {
    if (fixtures) await fixtures.cleanup();
  });

  it("allows each user to read their own profile, workspace, and membership", async () => {
    await expectAllowedReads(userA, workspaceA);
    await expectAllowedReads(userB, workspaceB);
  });

  it("blocks User A attacks on User B and verifies final state independently", async () => {
    await executeAttackMatrix(
      fixtures,
      userA,
      userB,
      workspaceA,
      workspaceB,
      "RLS B",
    );
  });

  it("blocks User B attacks on User A and verifies final state independently", async () => {
    await executeAttackMatrix(
      fixtures,
      userB,
      userA,
      workspaceB,
      workspaceA,
      "RLS A",
    );
  });

  it("blocks anonymous reads, writes, deletes, and privileged RPCs", async () => {
    const anonymous = fixtures.anonymous;
    for (const table of [
      "profiles",
      "workspaces",
      "workspace_memberships",
    ] as const) {
      const read = await rawTable(fixtures, anonymous, table, "GET");
      await expectDeniedResponse(read);
      const insert = await rawTable(fixtures, anonymous, table, "POST", {});
      await expectDeniedResponse(insert);
      const update = await rawTable(fixtures, anonymous, table, "PATCH", {});
      await expectDeniedResponse(update);
      const remove = await rawTable(fixtures, anonymous, table, "DELETE");
      await expectDeniedResponse(remove);
    }

    const onboarding = await rawRpc(
      fixtures,
      anonymous,
      "complete_onboarding",
      {},
    );
    const settings = await rawRpc(
      fixtures,
      anonymous,
      "update_business_settings",
      {},
    );
    expect(onboarding.ok).toBe(false);
    expect(settings.ok).toBe(false);

    await expectAdminState(fixtures, userA.id, workspaceA, "RLS A");
    await expectAdminState(fixtures, userB.id, workspaceB, "RLS B");
  });
});

async function updateBusiness(
  user: TestUser,
  workspaceName: string,
  businessName: string,
  countryCode: string,
) {
  const { error } = await user.client.rpc("update_business_settings", {
    p_workspace_name: workspaceName,
    p_business_name: businessName,
    p_business_type: "Independent reseller",
    p_country_code: countryCode,
  });
  expect(error).toBeNull();
}

async function readAccountState(
  client: SupabaseClient<Database>,
  userId: string,
  workspaceId: string,
) {
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("business_name,completed_onboarding")
    .eq("id", userId)
    .single();
  const { data: workspace, error: workspaceError } = await client
    .from("workspaces")
    .select("name,country_code")
    .eq("id", workspaceId)
    .single();
  expect(profileError).toBeNull();
  expect(workspaceError).toBeNull();
  if (!profile || !workspace) throw new Error("Expected account fixture was absent.");
  return { profile, workspace };
}

async function expectAllowedReads(user: TestUser, workspaceId: string) {
  const { data: profiles, error: profileError } = await user.client
    .from("profiles")
    .select("id");
  const { data: workspaces, error: workspaceError } = await user.client
    .from("workspaces")
    .select("id");
  const { data: memberships, error: membershipError } = await user.client
    .from("workspace_memberships")
    .select("workspace_id,user_id");
  expect(profileError).toBeNull();
  expect(workspaceError).toBeNull();
  expect(membershipError).toBeNull();
  expect(profiles).toEqual([{ id: user.id }]);
  expect(workspaces).toEqual([{ id: workspaceId }]);
  expect(memberships).toEqual([{ workspace_id: workspaceId, user_id: user.id }]);
}

async function executeAttackMatrix(
  fixtures: SupabaseFixtureManager,
  attacker: TestUser,
  victim: TestUser,
  attackerWorkspace: string,
  victimWorkspace: string,
  expectedVictimBusinessName: string,
) {
  const { data: victimProfiles } = await attacker.client
    .from("profiles")
    .select("id")
    .eq("id", victim.id);
  const { data: victimWorkspaces } = await attacker.client
    .from("workspaces")
    .select("id")
    .eq("id", victimWorkspace);
  const { data: victimMemberships } = await attacker.client
    .from("workspace_memberships")
    .select("workspace_id")
    .eq("workspace_id", victimWorkspace);
  expect(victimProfiles).toEqual([]);
  expect(victimWorkspaces).toEqual([]);
  expect(victimMemberships).toEqual([]);

  await attacker.client
    .from("profiles")
    .update({ display_name: "Cross-user mutation" })
    .eq("id", victim.id);
  await attacker.client
    .from("workspaces")
    .update({ name: "Cross-workspace mutation" })
    .eq("id", victimWorkspace);

  const attacks = [
    rawTable(fixtures, attacker.client, "profiles", "POST", { id: victim.id }),
    rawTable(
      fixtures,
      attacker.client,
      "profiles",
      "PATCH",
      { id: victim.id },
      `id=eq.${attacker.id}`,
    ),
    rawTable(
      fixtures,
      attacker.client,
      "profiles",
      "DELETE",
      undefined,
      `id=eq.${victim.id}`,
    ),
    rawTable(fixtures, attacker.client, "workspaces", "POST", {
      name: "Unauthorized workspace",
      country_code: "CA",
      default_currency: "CAD",
      locale: "en-CA",
      time_zone: "America/Toronto",
    }),
    rawTable(
      fixtures,
      attacker.client,
      "workspaces",
      "PATCH",
      { id: victimWorkspace },
      `id=eq.${attackerWorkspace}`,
    ),
    rawTable(
      fixtures,
      attacker.client,
      "workspaces",
      "DELETE",
      undefined,
      `id=eq.${victimWorkspace}`,
    ),
    rawTable(fixtures, attacker.client, "workspace_memberships", "POST", {
      workspace_id: victimWorkspace,
      user_id: attacker.id,
      role: "owner",
    }),
    rawTable(
      fixtures,
      attacker.client,
      "workspace_memberships",
      "PATCH",
      { workspace_id: victimWorkspace },
      `workspace_id=eq.${attackerWorkspace}&user_id=eq.${attacker.id}`,
    ),
    rawTable(
      fixtures,
      attacker.client,
      "workspace_memberships",
      "PATCH",
      { user_id: victim.id },
      `workspace_id=eq.${attackerWorkspace}&user_id=eq.${attacker.id}`,
    ),
    rawTable(
      fixtures,
      attacker.client,
      "workspace_memberships",
      "DELETE",
      undefined,
      `workspace_id=eq.${victimWorkspace}`,
    ),
  ];
  const results = await Promise.all(attacks);
  for (const response of results) await expectDeniedResponse(response);

  await expectAdminState(
    fixtures,
    victim.id,
    victimWorkspace,
    expectedVictimBusinessName,
  );
  const { count: attackerMembershipCount } = await fixtures.admin
    .from("workspace_memberships")
    .select("workspace_id", { count: "exact", head: true })
    .eq("user_id", attacker.id)
    .eq("workspace_id", attackerWorkspace);
  expect(attackerMembershipCount).toBe(1);
}

async function expectAdminState(
  fixtures: SupabaseFixtureManager,
  userId: string,
  workspaceId: string,
  expectedBusinessName: string,
) {
  const { data: profile } = await fixtures.admin
    .from("profiles")
    .select("business_name,display_name")
    .eq("id", userId)
    .single();
  const { data: workspace } = await fixtures.admin
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .single();
  const { count: membershipCount } = await fixtures.admin
    .from("workspace_memberships")
    .select("workspace_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId);
  expect(profile?.business_name).toBe(expectedBusinessName);
  expect(profile?.display_name).not.toBe("Cross-user mutation");
  expect(workspace?.name).not.toBe("Cross-workspace mutation");
  expect(membershipCount).toBe(1);
}

async function rawTable(
  fixtures: SupabaseFixtureManager,
  client: SupabaseClient<Database>,
  table: "profiles" | "workspaces" | "workspace_memberships",
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: Record<string, unknown>,
  query = "",
) {
  const { data } = await client.auth.getSession();
  const headers: Record<string, string> = {
    apikey: fixtures.environment.publishableKey,
    "content-type": "application/json",
    prefer: "return=representation",
  };
  if (data.session) headers.authorization = `Bearer ${data.session.access_token}`;
  return fetch(
    `${fixtures.environment.url}/rest/v1/${table}${query ? `?${query}` : ""}`,
    {
      method,
      headers,
      body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(body),
    },
  );
}

async function expectDeniedResponse(response: Response) {
  if (!response.ok) return;
  const payload = await response.json();
  expect(payload).toEqual([]);
}

async function rawRpc(
  fixtures: SupabaseFixtureManager,
  client: SupabaseClient<Database>,
  functionName: "complete_onboarding" | "update_business_settings",
  body: Record<string, unknown>,
) {
  const { data } = await client.auth.getSession();
  const headers: Record<string, string> = {
    apikey: fixtures.environment.publishableKey,
    "content-type": "application/json",
  };
  if (data.session) headers.authorization = `Bearer ${data.session.access_token}`;
  return fetch(`${fixtures.environment.url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}
