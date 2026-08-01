const MAIN_PROJECT_REF = "fyosviaioflewfqcdkmx";

export type SupabaseTestEnvironment = {
  target: "local" | "disposable" | "branch";
  url: string;
  publishableKey: string;
  secretKey: string;
  projectRef: string;
  mailpitUrl?: string;
  appUrl: string;
};

export function getSupabaseTestEnvironment(): SupabaseTestEnvironment {
  const target = process.env.PHASE1_TEST_SUPABASE_TARGET;
  const url = process.env.PHASE1_TEST_SUPABASE_URL;
  const publishableKey =
    process.env.PHASE1_TEST_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.PHASE1_TEST_SUPABASE_SECRET_KEY;
  const projectRef = process.env.PHASE1_TEST_SUPABASE_PROJECT_REF;
  const confirmation = process.env.PHASE1_TEST_ISOLATED_CONFIRMATION;

  if (
    !target ||
    !url ||
    !publishableKey ||
    !secretKey ||
    !projectRef ||
    !confirmation
  ) {
    throw new Error(
      "Phase 1 real-database tests are blocked: isolated test configuration is incomplete.",
    );
  }
  if (!new Set(["local", "disposable", "branch"]).has(target)) {
    throw new Error("Refusing an unknown Supabase test-target classification.");
  }
  if (projectRef === MAIN_PROJECT_REF) {
    throw new Error("Refusing to run destructive tests against the main Supabase project.");
  }
  if (confirmation !== `I_CONFIRM_ISOLATED_${projectRef}`) {
    throw new Error("The isolated-target confirmation does not match the test project.");
  }

  const parsed = new URL(url);
  const isLocal = new Set(["localhost", "127.0.0.1", "::1"]).has(
    parsed.hostname,
  );
  if (target === "local" && !isLocal) {
    throw new Error("A target classified as local must use a loopback Supabase URL.");
  }
  if (target !== "local" && isLocal) {
    throw new Error("A disposable remote target cannot use a loopback URL.");
  }

  return {
    target: target as SupabaseTestEnvironment["target"],
    url,
    publishableKey,
    secretKey,
    projectRef,
    mailpitUrl: process.env.PHASE1_TEST_MAILPIT_URL,
    appUrl: process.env.PHASE1_TEST_APP_URL ?? "http://127.0.0.1:3000",
  };
}
