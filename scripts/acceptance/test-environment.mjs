const MAIN_PROJECT_REF = "fyosviaioflewfqcdkmx";
const TEST_SECRET_KEY_VARIABLE = "PHASE1_TEST_SUPABASE_SECRET_KEY";
const CHILD_PROCESS_SECRET_PATTERN =
  /(SECRET|SERVICE_ROLE|PASSWORD|REFRESH_TOKEN|ACCESS_TOKEN)/i;

export function capturePlaywrightTestEnvironment(source = process.env) {
  const environment = getTestEnvironment(source);

  if (isPlaywrightWorker(source)) {
    delete source[TEST_SECRET_KEY_VARIABLE];
  }

  return environment;
}

export function sanitizeApplicationEnvironment(source = process.env) {
  const safeEnvironment = { ...source };

  for (const name of Object.keys(safeEnvironment)) {
    if (CHILD_PROCESS_SECRET_PATTERN.test(name)) {
      delete safeEnvironment[name];
    }
  }

  return safeEnvironment;
}

function isPlaywrightWorker(source) {
  return (
    /^\d+$/.test(source.TEST_WORKER_INDEX ?? "") &&
    /^\d+$/.test(source.TEST_PARALLEL_INDEX ?? "")
  );
}

export function getTestEnvironment(source = process.env) {
  const environment = {
    target: source.PHASE1_TEST_SUPABASE_TARGET,
    url: source.PHASE1_TEST_SUPABASE_URL,
    publishableKey: source.PHASE1_TEST_SUPABASE_PUBLISHABLE_KEY,
    secretKey: source.PHASE1_TEST_SUPABASE_SECRET_KEY,
    projectRef: source.PHASE1_TEST_SUPABASE_PROJECT_REF,
    confirmation: source.PHASE1_TEST_ISOLATED_CONFIRMATION,
    mailpitUrl: source.PHASE1_TEST_MAILPIT_URL,
    appUrl: source.PHASE1_TEST_APP_URL ?? "http://127.0.0.1:3000",
  };

  if (
    !environment.target ||
    !environment.url ||
    !environment.publishableKey ||
    !environment.secretKey ||
    !environment.projectRef ||
    !environment.confirmation
  ) {
    throw new Error("The isolated Supabase test environment is incomplete.");
  }
  if (!new Set(["local", "disposable", "branch"]).has(environment.target)) {
    throw new Error("Refusing an unknown Supabase test target.");
  }
  if (environment.projectRef === MAIN_PROJECT_REF) {
    throw new Error("Refusing to test against the main Supabase project.");
  }
  if (
    environment.confirmation !==
    `I_CONFIRM_ISOLATED_${environment.projectRef}`
  ) {
    throw new Error("The isolated Supabase target confirmation is invalid.");
  }

  const parsed = new URL(environment.url);
  const isLoopback = new Set(["127.0.0.1", "localhost", "::1"]).has(
    parsed.hostname,
  );
  if (environment.target === "local" && !isLoopback) {
    throw new Error("A local test target must use a loopback URL.");
  }
  if (environment.target !== "local" && isLoopback) {
    throw new Error("A remote disposable target cannot use a loopback URL.");
  }

  return environment;
}
