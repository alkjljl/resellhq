import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../../supabase/migrations/202608020001_harden_onboarding_consent.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("strict onboarding consent migration", () => {
  it("removes the coercible Boolean RPC and exposes a JSON-typed contract", () => {
    expect(migration).toContain("p_accepted_terms jsonb");
    expect(migration).toMatch(
      /drop function public\.complete_onboarding\([\s\S]*?boolean[\s\S]*?\);/,
    );
  });

  it("accepts only the exact JSON Boolean true before persistence", () => {
    const typeGuard = migration.indexOf(
      "jsonb_typeof(p_accepted_terms) is distinct from 'boolean'",
    );
    const valueGuard = migration.indexOf(
      "p_accepted_terms <> 'true'::jsonb",
    );
    const workspaceInsert = migration.indexOf("insert into public.workspaces");

    expect(typeGuard).toBeGreaterThan(-1);
    expect(valueGuard).toBeGreaterThan(typeGuard);
    expect(workspaceInsert).toBeGreaterThan(valueGuard);
  });

  it("keeps the RPC authenticated-only with an empty search path", () => {
    expect(migration).toContain("security definer\nset search_path = ''");
    expect(migration).toContain(
      "from public, anon;\n\ngrant execute on function public.complete_onboarding(",
    );
    expect(migration).toContain(") to authenticated;");
  });

  it("keeps the application contract restricted to exact consent", () => {
    const databaseTypes = readFileSync(
      new URL("../../types/database.ts", import.meta.url),
      "utf8",
    );

    expect(databaseTypes).toContain("p_accepted_terms: true;");
    expect(databaseTypes).not.toContain("p_accepted_terms: boolean;");
  });
});
