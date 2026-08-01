import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../../supabase/migrations/202607310001_authoritative_onboarding_contract.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("authoritative onboarding migration", () => {
  it("keeps business_name nullable and does not invent consent", () => {
    expect(migration).toContain("add column if not exists accepted_terms boolean");
    expect(migration).not.toMatch(/accepted_terms\s+boolean\s+not null/i);
    expect(migration).not.toMatch(/set\s+accepted_terms\s*=\s*true\s*where/i);
    expect(migration).not.toMatch(/business_name\s+text\s+not null/i);
  });

  it("makes the optional business name genuinely omittable at the RPC boundary", () => {
    const signature = migration.slice(
      migration.indexOf("create function public.complete_onboarding("),
      migration.indexOf(")\nreturns uuid"),
    );

    expect(signature).toMatch(
      /p_time_zone text,\s+p_business_name text default null\s*$/,
    );
  });

  it("requires exact consent before any onboarding persistence", () => {
    const consentGuard = migration.indexOf(
      "p_accepted_terms is distinct from true",
    );
    const workspaceInsert = migration.indexOf("insert into public.workspaces");

    expect(consentGuard).toBeGreaterThan(-1);
    expect(workspaceInsert).toBeGreaterThan(consentGuard);
  });

  it("uses authenticated identity and a neutral workspace name", () => {
    expect(migration).toContain("current_user_id uuid := (select auth.uid())");
    expect(migration).toContain("'My workspace'");
    expect(migration).not.toContain("p_user_id");
  });

  it("stores markets and channels in separate array columns", () => {
    expect(migration).toContain("selling_markets text[]");
    expect(migration).toContain("selling_channels text[]");
    expect(migration).toContain("selling_markets = p_selling_markets");
    expect(migration).toContain("selling_channels = p_selling_channels");
  });

  it("preserves the first completion timestamp and reuses one owner workspace", () => {
    expect(migration).toContain(
      "completed_onboarding = coalesce(\n      public.profiles.completed_onboarding",
    );
    expect(migration).toContain(
      "onboarding_completed_at = coalesce(\n      public.profiles.onboarding_completed_at",
    );
    expect(migration).toContain(
      "where membership.user_id = current_user_id\n    and membership.role = 'owner'",
    );
  });

  it("removes the old RPC overload that could bypass the complete contract", () => {
    expect(migration).toMatch(
      /drop function public\.complete_onboarding\([\s\S]*?text[\s\S]*?\);/,
    );
    expect(migration).toContain(
      "revoke all on function public.complete_onboarding(",
    );
  });

  it("clearing a business name does not touch completion state", () => {
    const updateBusinessFunction = migration.slice(
      migration.indexOf("create function public.update_business_settings"),
    );

    expect(updateBusinessFunction).toContain(
      "p_business_name := nullif(btrim(p_business_name), '')",
    );
    expect(updateBusinessFunction).toContain(
      "set business_name = p_business_name",
    );
    expect(updateBusinessFunction).not.toContain("completed_onboarding =");
  });
});
