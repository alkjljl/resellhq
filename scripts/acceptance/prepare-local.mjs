import {
  assertContainerRuntime,
  assertSupabaseVersion,
  localBinary,
  run,
} from "./process-utils.mjs";

const supabase = localBinary("supabase");
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
run(supabase, ["start"], {
  capture: true,
  label: "Supabase local start",
});
run(supabase, ["db", "reset", "--local"], {
  label: "Supabase local migration reset",
});
