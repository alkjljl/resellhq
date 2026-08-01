import { randomUUID } from "node:crypto";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getSupabaseTestEnvironment,
  type SupabaseTestEnvironment,
} from "./supabase-test-env";

export type TestUser = {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient<Database>;
  user: User;
};

export const validOnboardingArgs = {
  p_first_name: "Avery",
  p_last_name: "Chen",
  p_business_name: null as string | null,
  p_business_type: "Independent reseller",
  p_primary_category: "Clothing & accessories",
  p_country_code: "CA",
  p_default_currency: "CAD",
  p_selling_markets: ["CA", "US"],
  p_experience_level: "1-3 years",
  p_selling_channels: ["eBay", "Vinted"],
  p_accepted_terms: true,
  p_locale: "en-CA",
  p_time_zone: "America/Toronto",
};

export class SupabaseFixtureManager {
  readonly environment: SupabaseTestEnvironment;
  readonly admin: SupabaseClient<Database>;
  readonly anonymous: SupabaseClient<Database>;
  private readonly userIds = new Set<string>();
  private readonly workspaceIds = new Set<string>();

  constructor() {
    this.environment = getSupabaseTestEnvironment();
    this.admin = createTestClient(
      this.environment.url,
      this.environment.secretKey,
    );
    this.anonymous = createTestClient(
      this.environment.url,
      this.environment.publishableKey,
    );
  }

  async createUser(label: string): Promise<TestUser> {
    const suffix = randomUUID();
    const email = `phase1-${label}-${suffix}@example.invalid`;
    const password = `Phase1!${suffix}`;
    const { data, error } = await this.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Could not create isolated test user (${error?.code ?? "unknown"}).`);
    }
    this.userIds.add(data.user.id);

    const client = createTestClient(
      this.environment.url,
      this.environment.publishableKey,
    );
    const { data: signIn, error: signInError } =
      await client.auth.signInWithPassword({ email, password });
    if (signInError || !signIn.user) {
      throw new Error(
        `Could not authenticate isolated test user (${signInError?.code ?? "unknown"}).`,
      );
    }
    return { id: data.user.id, email, password, client, user: signIn.user };
  }

  async freshClient(user: TestUser) {
    const client = createTestClient(
      this.environment.url,
      this.environment.publishableKey,
    );
    const { error } = await client.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    if (error) throw new Error(`Fresh test sign-in failed (${error.code}).`);
    return client;
  }

  trackWorkspace(workspaceId: string) {
    this.workspaceIds.add(workspaceId);
  }

  async completeOnboarding(
    user: TestUser,
    overrides: Partial<typeof validOnboardingArgs> = {},
  ) {
    const { data, error } = await user.client.rpc("complete_onboarding", {
      ...validOnboardingArgs,
      ...overrides,
    });
    if (error || !data) {
      throw new Error(`Onboarding fixture failed (${error?.code ?? "unknown"}).`);
    }
    this.trackWorkspace(data);
    return data;
  }

  async cleanup() {
    // The environment guard is intentionally re-evaluated immediately before
    // every destructive teardown.
    getSupabaseTestEnvironment();

    const userIds = [...this.userIds];
    const workspaceIds = [...this.workspaceIds];
    for (const userId of userIds) {
      const { data } = await this.admin
        .from("workspace_memberships")
        .select("workspace_id")
        .eq("user_id", userId);
      data?.forEach((row) => this.workspaceIds.add(row.workspace_id));
    }

    for (const userId of userIds) {
      const { error } = await this.admin
        .from("workspace_memberships")
        .delete()
        .eq("user_id", userId);
      if (error) throw new Error(`Membership cleanup failed (${error.code}).`);
    }
    for (const workspaceId of new Set([...workspaceIds, ...this.workspaceIds])) {
      const { error } = await this.admin
        .from("workspaces")
        .delete()
        .eq("id", workspaceId);
      if (error) throw new Error(`Workspace cleanup failed (${error.code}).`);
    }
    for (const userId of userIds) {
      const { error } = await this.admin.auth.admin.deleteUser(userId);
      if (error) throw new Error(`Auth-user cleanup failed (${error.code}).`);
    }
  }
}

function createTestClient(url: string, key: string) {
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
