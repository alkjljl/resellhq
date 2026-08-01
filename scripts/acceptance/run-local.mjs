import {
  assertContainerRuntime,
  assertSupabaseVersion,
  loadLocalStatus,
  localBinary,
  run,
} from "./process-utils.mjs";
import { getTestEnvironment } from "./test-environment.mjs";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const supabase = localBinary("supabase");
localBinary("playwright", "@playwright/test");
assertSupabaseVersion(supabase, "2.109.1");
run(supabase, ["db", "reset", "--help"], {
  label: "Supabase db reset syntax check",
});
run(supabase, ["migration", "up", "--help"], {
  label: "Supabase migration up syntax check",
});
run(supabase, ["test", "db", "--help"], {
  label: "Supabase database-test syntax check",
});
assertContainerRuntime();

let started = false;
try {
  run(npm, ["run", "test:unit"], { label: "unit tests" });
  run(supabase, ["start"], {
    capture: true,
    label: "Supabase local start",
  });
  started = true;
  run(
    supabase,
    ["db", "reset", "--local", "--version", "202607270001", "--no-seed"],
    { label: "pre-correction local migration replay" },
  );
  const preCorrectionValues = loadLocalStatus(supabase);
  getTestEnvironment(preCorrectionValues);
  console.log(
    "Verified isolated local Supabase target on a loopback address; the production project reference is rejected.",
  );
  const preCorrectionEnvironment = {
    ...process.env,
    ...preCorrectionValues,
  };
  run(process.execPath, ["scripts/acceptance/legacy-upgrade.mjs", "seed"], {
    env: preCorrectionEnvironment,
    label: "legacy migration fixture",
  });
  run(supabase, ["migration", "up", "--local"], {
    label: "authoritative additive migration upgrade",
  });
  run(supabase, ["migration", "list", "--local"], {
    label: "local upgrade migration history",
  });
  run(process.execPath, ["scripts/acceptance/legacy-upgrade.mjs", "verify"], {
    env: preCorrectionEnvironment,
    label: "legacy migration preservation verification",
  });

  run(supabase, ["db", "reset", "--local"], {
    label: "clean local migration replay",
  });
  run(supabase, ["migration", "list", "--local"], {
    label: "clean local migration history",
  });
  run(supabase, ["db", "lint", "--local", "--level", "error"], {
    label: "database advisors/lint",
  });
  run(supabase, ["test", "db", "--local"], { label: "pgTAP tests" });

  const testEnvironment = {
    ...process.env,
    ...loadLocalStatus(supabase),
  };
  run(npm, ["run", "test:integration:auth-preflight"], {
    env: testEnvironment,
    label: "local Supabase Auth preflight",
  });
  run(npm, ["run", "test:integration"], {
    env: testEnvironment,
    label: "real Supabase integration tests",
  });
  run(npm, ["run", "test:e2e"], {
    env: testEnvironment,
    timeoutMs: 900_000,
    label: "desktop Playwright tests",
  });
  run(npm, ["run", "test:e2e:responsive"], {
    env: testEnvironment,
    timeoutMs: 900_000,
    label: "responsive Playwright tests",
  });
  run(npm, ["run", "lint"], { label: "ESLint" });
  run(npm, ["run", "typecheck"], { label: "TypeScript" });
  run(npm, ["run", "build"], {
    env: {
      ...process.env,
      NODE_OPTIONS:
        process.env.NODE_OPTIONS ?? "--max-old-space-size=2048",
    },
    label: "production build",
  });
} finally {
  if (started) {
    run(supabase, ["stop", "--no-backup"], {
      label: "Supabase local stop",
    });
  }
}
