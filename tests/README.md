# Phase 1 acceptance tests

The acceptance system has three independent layers:

1. `supabase/tests/database` runs transactional pgTAP schema, grant, function,
   constraint, and RLS tests.
2. `tests/integration` uses separate admin, anonymous, User A, and User B
   Supabase clients against an isolated environment.
3. `tests/e2e` runs real application flows through Playwright at the configured
   desktop and responsive viewports.

## Prerequisites

- Node.js and the repository's npm lockfile dependencies.
- A running Docker-compatible runtime for the local Supabase stack.
- The Supabase CLI pinned to `2.109.1` as a local dev dependency.
- `@playwright/test` pinned to `1.61.1` and its Chromium browser runtime.

Install the missing test tools with the established package manager when the
machine has sufficient disk space:

```powershell
npm install --save-dev --save-exact @playwright/test@1.61.1 supabase@2.109.1
npx playwright install chromium
```

The command versions and flags are checked by the preparation/acceptance
scripts before any database reset or migration replay.

## Safe local execution

```powershell
npm run acceptance:prepare
npm run test:acceptance
```

`test:acceptance` refuses to use the linked production project as a fallback.
It requires a loopback Supabase URL, replays migrations locally, tests the
upgrade from `202607270001` to `202607310001`, resets the local stack, runs
pgTAP, genuine-session integration tests, browser projects, lint, TypeScript,
and the production build, then stops the local stack without a backup.

## Explicit disposable environment

Copy the variable names in `.env.test.example` to the ignored
`.env.test.local` only for a confirmed disposable project or branch. The guard
requires `PHASE1_TEST_ISOLATED_CONFIRMATION` to equal
`I_CONFIRM_ISOLATED_<project-ref>` and always rejects the main ResellHQ project
reference. Do not prefix the server-side secret with `NEXT_PUBLIC_`.

Playwright traces, screenshots, and videos are disabled because authenticated
browser artifacts may contain session data. Test fixture cleanup uses only IDs
recorded during the current run.
