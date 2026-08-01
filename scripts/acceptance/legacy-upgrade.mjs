import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { root } from "./process-utils.mjs";
import { getTestEnvironment } from "./test-environment.mjs";

const mode = process.argv[2];
const stateDirectory = path.join(root, ".phase1-test-state");
const statePath = path.join(stateDirectory, "legacy-upgrade.json");
const environment = getTestEnvironment();
const admin = createClient(environment.url, environment.secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

if (mode === "seed") await seedLegacyState();
else if (mode === "verify") await verifyUpgradedState();
else throw new Error('Expected mode "seed" or "verify".');

async function seedLegacyState() {
  const suffix = randomUUID();
  const email = `phase1-legacy-${suffix}@example.invalid`;
  const password = `Phase1!${suffix}`;
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (createError || !created.user) {
    throw new Error(`Legacy fixture creation failed (${createError?.code ?? "unknown"}).`);
  }

  const client = createClient(environment.url, environment.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(`Legacy fixture sign-in failed (${signInError.code}).`);
  }
  const { data: workspaceId, error: onboardingError } = await client.rpc(
    "complete_onboarding",
    {
      p_display_name: "Legacy Reseller",
      p_workspace_name: "Preserved legacy workspace",
      p_business_type: "Independent reseller",
      p_country_code: "CA",
      p_default_currency: "CAD",
      p_locale: "en-CA",
      p_time_zone: "America/Toronto",
    },
  );
  if (onboardingError || !workspaceId) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(
      `Legacy onboarding fixture failed (${onboardingError?.code ?? "unknown"}).`,
    );
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", created.user.id)
    .single();
  if (profileError || !profile?.onboarding_completed_at) {
    throw new Error(`Legacy profile read failed (${profileError?.code ?? "unknown"}).`);
  }

  await mkdir(stateDirectory, { recursive: true });
  await writeFile(
    statePath,
    JSON.stringify({
      userId: created.user.id,
      workspaceId,
      completedAt: profile.onboarding_completed_at,
      workspaceName: "Preserved legacy workspace",
    }),
    { encoding: "utf8", mode: 0o600 },
  );
}

async function verifyUpgradedState() {
  const state = JSON.parse(await readFile(statePath, "utf8"));
  try {
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select(
        "business_name,accepted_terms,completed_onboarding,onboarding_completed,onboarding_completed_at",
      )
      .eq("id", state.userId)
      .single();
    const { data: workspace, error: workspaceError } = await admin
      .from("workspaces")
      .select("name")
      .eq("id", state.workspaceId)
      .single();
    const { count: membershipCount, error: membershipError } = await admin
      .from("workspace_memberships")
      .select("workspace_id", { count: "exact", head: true })
      .eq("workspace_id", state.workspaceId)
      .eq("user_id", state.userId);

    assert.equal(profileError, null);
    assert.equal(workspaceError, null);
    assert.equal(membershipError, null);
    assert.equal(profile.business_name, null);
    assert.equal(profile.accepted_terms, null);
    assert.equal(profile.completed_onboarding, state.completedAt);
    assert.equal(profile.onboarding_completed, true);
    assert.equal(profile.onboarding_completed_at, state.completedAt);
    assert.equal(workspace.name, state.workspaceName);
    assert.equal(membershipCount, 1);
  } finally {
    // Exact IDs from this fixture are used in dependency order. The environment
    // guard is intentionally rechecked immediately before destructive cleanup.
    getTestEnvironment();
    await admin
      .from("workspace_memberships")
      .delete()
      .eq("workspace_id", state.workspaceId)
      .eq("user_id", state.userId);
    await admin.from("workspaces").delete().eq("id", state.workspaceId);
    await admin.auth.admin.deleteUser(state.userId);
  }
}
