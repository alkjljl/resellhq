import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export const root = path.resolve(import.meta.dirname, "..", "..");

export function localBinary(name, packageName = name) {
  const extension = process.platform === "win32" ? ".cmd" : "";
  const binary = path.join(root, "node_modules", ".bin", `${name}${extension}`);
  const packageManifest = path.join(
    root,
    "node_modules",
    ...packageName.split("/"),
    "package.json",
  );
  if (!existsSync(binary) || !existsSync(packageManifest)) {
    throw new Error(
      `Required local test dependency "${packageName}" is unavailable. Run npm install after ensuring sufficient disk space.`,
    );
  }
  return binary;
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: options.env ?? process.env,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    shell: false,
    timeout: options.timeoutMs ?? 600_000,
    killSignal: "SIGTERM",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${options.label ?? command} failed with exit code ${result.status}.`);
  }
  return options.capture ? result.stdout : "";
}

export function assertSupabaseVersion(supabaseBinary, expectedVersion) {
  const actualVersion = run(supabaseBinary, ["--version"], {
    capture: true,
    label: "Supabase CLI version check",
  }).trim();
  if (actualVersion !== expectedVersion) {
    throw new Error(
      `Supabase CLI ${expectedVersion} is required; found ${actualVersion || "an unknown version"}.`,
    );
  }
}

export function assertContainerRuntime() {
  const result = spawnSync("docker", ["version", "--format", "{{.Server.Version}}"], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
    shell: false,
    timeout: 15_000,
  });
  if (result.status !== 0 || !result.stdout.trim()) {
    throw new Error(
      "A running Docker-compatible local runtime is required. The main linked Supabase project will not be used as a fallback.",
    );
  }
}

export function loadLocalStatus(supabaseBinary) {
  const output = run(supabaseBinary, ["status", "--output", "env"], {
    capture: true,
    label: "supabase status",
  });
  const values = new Map();
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    values.set(match[1], match[2].replace(/^"|"$/g, ""));
  }

  const url = values.get("API_URL");
  const publishableKey = values.get("ANON_KEY") ?? values.get("PUBLISHABLE_KEY");
  const secretKey = values.get("SERVICE_ROLE_KEY") ?? values.get("SECRET_KEY");
  if (!url || !publishableKey || !secretKey) {
    throw new Error("Local Supabase status did not return the required test configuration.");
  }
  const parsed = new URL(url);
  if (!new Set(["127.0.0.1", "localhost", "::1"]).has(parsed.hostname)) {
    throw new Error("Refusing to use a non-local Supabase URL in the local acceptance runner.");
  }

  return {
    PHASE1_TEST_SUPABASE_TARGET: "local",
    PHASE1_TEST_SUPABASE_URL: url,
    PHASE1_TEST_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    PHASE1_TEST_SUPABASE_SECRET_KEY: secretKey,
    PHASE1_TEST_SUPABASE_PROJECT_REF: "resellhq",
    PHASE1_TEST_ISOLATED_CONFIRMATION: "I_CONFIRM_ISOLATED_resellhq",
    PHASE1_TEST_MAILPIT_URL:
      values.get("MAILPIT_URL") ?? "http://127.0.0.1:54324",
    PHASE1_TEST_APP_URL: "http://localhost:3000",
  };
}
