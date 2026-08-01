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

const AUTH_HEALTH_TIMEOUT_MS = 30_000;
const AUTH_HEALTH_ATTEMPT_TIMEOUT_MS = 3_000;
const AUTH_HEALTH_RETRY_MS = 250;

type AuthHealthResponse = {
  name: string;
  version: string;
};

export function describeAuthError(error: unknown): string {
  if (!error) {
    return "class=MissingAuthResult; status=unavailable; code=unavailable; message=Supabase Auth returned no user";
  }

  const value = asErrorRecord(error);
  const errorClass = safeDiagnosticToken(
    error instanceof Error
      ? error.constructor.name || error.name
      : typeof value.name === "string"
        ? value.name
        : typeof error,
  );
  const status = safeDiagnosticToken(value.status);
  const code = safeDiagnosticToken(value.code);
  const message = sanitizeDiagnosticMessage(
    error instanceof Error
      ? error.message
      : typeof value.message === "string"
        ? value.message
        : "No error message was provided",
  );

  return `class=${errorClass}; status=${status}; code=${code}; message=${message}`;
}

export async function waitForLocalAuthHealth(
  environment: SupabaseTestEnvironment,
): Promise<AuthHealthResponse> {
  if (environment.target !== "local") {
    throw new Error("The local Auth preflight requires an isolated loopback target.");
  }

  const endpoint = new URL("/auth/v1/health", environment.url);
  const deadline = Date.now() + AUTH_HEALTH_TIMEOUT_MS;
  let lastEvidence = "no response received";

  while (Date.now() < deadline) {
    try {
      const response = await fetch(endpoint, {
        headers: { apikey: environment.publishableKey },
        signal: AbortSignal.timeout(AUTH_HEALTH_ATTEMPT_TIMEOUT_MS),
      });
      if (response.ok) {
        const body = (await response.json()) as Partial<AuthHealthResponse>;
        if (body.name === "GoTrue" && typeof body.version === "string") {
          return body as AuthHealthResponse;
        }
        lastEvidence = `HTTP ${response.status} returned an unexpected health payload`;
      } else {
        lastEvidence = `HTTP ${response.status}`;
      }
    } catch (error) {
      lastEvidence = describeAuthError(error);
    }

    await new Promise((resolve) => setTimeout(resolve, AUTH_HEALTH_RETRY_MS));
  }

  throw new Error(
    `Local Supabase Auth did not become healthy within ${AUTH_HEALTH_TIMEOUT_MS}ms (${lastEvidence}).`,
  );
}

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
      throw new Error(
        `Could not create isolated test user (${describeAuthError(error)}).`,
      );
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
        `Could not authenticate isolated test user (${describeAuthError(signInError)}).`,
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
    if (error) {
      throw new Error(`Fresh test sign-in failed (${describeAuthError(error)}).`);
    }
    return client;
  }

  async deleteUser(userId: string) {
    // The environment guard is intentionally re-evaluated immediately before
    // destructive cleanup.
    getSupabaseTestEnvironment();
    const { error } = await this.admin.auth.admin.deleteUser(userId);
    if (error) {
      throw new Error(`Auth-user cleanup failed (${describeAuthError(error)}).`);
    }
    this.userIds.delete(userId);
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
      if (error) {
        throw new Error(`Auth-user cleanup failed (${describeAuthError(error)}).`);
      }
    }
  }
}

function asErrorRecord(error: unknown): Record<string, unknown> {
  return typeof error === "object" && error !== null
    ? (error as Record<string, unknown>)
    : {};
}

function safeDiagnosticToken(value: unknown): string {
  const normalized =
    typeof value === "number"
      ? String(value)
      : typeof value === "string"
        ? value
        : "unavailable";
  return /^[A-Za-z0-9_.-]{1,80}$/.test(normalized)
    ? normalized
    : "unavailable";
}

function sanitizeDiagnosticMessage(message: string): string {
  return message
    .replace(/\bBearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+\b/gi, "[REDACTED_KEY]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_JWT]")
    .replace(/\b(?:postgres|postgresql):\/\/\S+/gi, "[REDACTED_DATABASE_URL]")
    .replace(/\b(?:password|token|apikey|authorization)\s*[=:]\s*\S+/gi, "$1=[REDACTED]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
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
