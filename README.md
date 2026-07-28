# ResellHQ

ResellHQ Phase 1 is the secure account and workspace foundation for a worldwide
resale business operating system.

## Phase 1 scope

- Merchant Ledger light, dark, and system design tokens
- Marketing homepage
- Email/password and Google authentication through Supabase
- Email confirmation, OAuth callback, password recovery, and logout
- Three-step international onboarding
- User profiles, business workspaces, and owner memberships
- Server-protected application routes
- Responsive desktop, tablet, and mobile application shell
- Honest setup dashboard without fabricated business data
- Profile, business, preference, and security settings
- Shared Zod validation and focused Vitest coverage

Inventory, listings, sales, expenses, contacts, analytics, integrations,
subscriptions, and billing are intentionally not implemented. Their navigation
entries are labeled as upcoming and do not link to routes.

## Local configuration

Copy `.env.example` to `.env.local` and configure:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
```

Never commit `.env.local` or a service-role key.

## Database migrations

Migration history is forward-only:

1. `202607250001_create_profiles.sql`
2. `202607270001_phase1_foundation.sql`

The second migration preserves the earlier profile table, adds the canonical
workspace ownership model, tightens column privileges, enables RLS on every
private Phase 1 table, and introduces atomic onboarding and preference
functions.

Apply only migrations that are not already recorded for the existing Supabase
project. Do not edit or re-run an applied migration to repair production data.

## Local verification

```text
npm run lint
npm run typecheck
npm test
npm run build
```

## Required Supabase dashboard review

- Site URL for local development: `http://localhost:3000`
- Redirect allow-list for local development: `http://localhost:3000/**`
- Keep Google’s authorized redirect URI set to the existing Supabase callback
  URL ending in `/auth/v1/callback`
- Confirm the existing Google provider remains enabled
- Confirm email verification and recovery templates link through
  `/auth/callback`
- Review authentication rate limits before launch
- Review email templates and sender configuration before launch

No avatar storage bucket is required in Phase 1.
