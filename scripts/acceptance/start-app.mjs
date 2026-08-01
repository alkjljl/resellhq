import { spawn } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "..");
const next = path.join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next",
);
const safeEnvironment = { ...process.env };
for (const name of Object.keys(safeEnvironment)) {
  if (/(SECRET|SERVICE_ROLE|PASSWORD|REFRESH_TOKEN|ACCESS_TOKEN)/i.test(name)) {
    delete safeEnvironment[name];
  }
}
safeEnvironment.NEXT_PUBLIC_SUPABASE_URL =
  process.env.PHASE1_TEST_SUPABASE_URL;
safeEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  process.env.PHASE1_TEST_SUPABASE_PUBLISHABLE_KEY;
safeEnvironment.NEXT_PUBLIC_APP_URL =
  process.env.PHASE1_TEST_APP_URL ?? "http://127.0.0.1:3000";

const child = spawn(next, ["dev", "--hostname", "127.0.0.1", "--port", "3000"], {
  cwd: root,
  env: safeEnvironment,
  stdio: "inherit",
  shell: false,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code) => process.exit(code ?? 1));
