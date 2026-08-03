begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'workspaces', 'workspaces exists');
select has_table(
  'public',
  'workspace_memberships',
  'workspace_memberships exists'
);

select has_column('public', 'profiles', 'first_name', 'first_name exists');
select has_column('public', 'profiles', 'last_name', 'last_name exists');
select has_column('public', 'profiles', 'business_name', 'business_name exists');
select has_column('public', 'profiles', 'accepted_terms', 'accepted_terms exists');
select has_column(
  'public',
  'profiles',
  'completed_onboarding',
  'completed_onboarding exists'
);
select col_type_is(
  'public', 'profiles', 'business_name', 'text'::text,
  'business_name uses text'
);
select col_is_null(
  'public',
  'profiles',
  'business_name',
  'business_name remains nullable'
);
select col_type_is(
  'public', 'profiles', 'accepted_terms', 'boolean'::text,
  'accepted_terms uses boolean'
);
select col_type_is(
  'public',
  'profiles',
  'completed_onboarding',
  'timestamp with time zone'::text,
  'completed_onboarding uses timestamptz'
);
select col_type_is(
  'public', 'profiles', 'id', 'uuid'::text, 'profile id uses uuid'
);
select col_type_is(
  'public', 'profiles', 'first_name', 'text'::text, 'first_name uses text'
);
select col_type_is(
  'public', 'profiles', 'last_name', 'text'::text, 'last_name uses text'
);
select col_type_is(
  'public', 'profiles', 'onboarding_completed', 'boolean'::text,
  'onboarding_completed uses boolean'
);
select col_type_is(
  'public', 'profiles', 'theme_preference', 'text'::text,
  'theme_preference uses text'
);
select col_type_is(
  'public', 'profiles', 'created_at', 'timestamp with time zone'::text,
  'profile created_at uses timestamptz'
);
select col_type_is(
  'public', 'profiles', 'updated_at', 'timestamp with time zone'::text,
  'profile updated_at uses timestamptz'
);
select col_not_null(
  'public', 'profiles', 'onboarding_completed',
  'onboarding_completed is required'
);
select col_not_null(
  'public', 'profiles', 'theme_preference', 'theme_preference is required'
);
select col_not_null('public', 'profiles', 'created_at', 'created_at is required');
select col_not_null('public', 'profiles', 'updated_at', 'updated_at is required');
select col_default_is(
  'public', 'profiles', 'onboarding_completed', 'false'::text,
  'onboarding_completed defaults to false'
);
select col_default_is(
  'public', 'profiles', 'theme_preference', 'system'::text,
  'theme_preference defaults to system'
);

select has_column(
  'public',
  'workspaces',
  'primary_category',
  'primary_category exists'
);
select has_column(
  'public',
  'workspaces',
  'selling_markets',
  'selling_markets exists'
);
select has_column(
  'public',
  'workspaces',
  'experience_level',
  'experience_level exists'
);
select has_column(
  'public',
  'workspaces',
  'selling_channels',
  'selling_channels exists'
);
select col_type_is(
  'public', 'workspaces', 'selling_markets', 'text[]'::text,
  'selling_markets uses text[]'
);
select col_type_is(
  'public', 'workspaces', 'selling_channels', 'text[]'::text,
  'selling_channels uses text[]'
);
select col_type_is(
  'public', 'workspaces', 'id', 'uuid'::text, 'workspace id uses uuid'
);
select col_type_is(
  'public', 'workspaces', 'name', 'text'::text, 'workspace name uses text'
);
select col_type_is(
  'public', 'workspaces', 'country_code', 'text'::text, 'country_code uses text'
);
select col_type_is(
  'public', 'workspaces', 'default_currency', 'text'::text,
  'default_currency uses text'
);
select col_type_is(
  'public', 'workspaces', 'locale', 'text'::text, 'locale uses text'
);
select col_type_is(
  'public', 'workspaces', 'time_zone', 'text'::text, 'time_zone uses text'
);
select col_not_null('public', 'workspaces', 'name', 'workspace name is required');
select col_not_null(
  'public', 'workspaces', 'country_code', 'country_code is required'
);
select col_not_null(
  'public', 'workspaces', 'default_currency', 'default_currency is required'
);
select col_not_null('public', 'workspaces', 'locale', 'locale is required');
select col_not_null('public', 'workspaces', 'time_zone', 'time_zone is required');
select col_has_default('public', 'workspaces', 'id', 'workspace id has a default');

select col_type_is(
  'public', 'workspace_memberships', 'workspace_id', 'uuid'::text,
  'membership workspace_id uses uuid'
);
select col_type_is(
  'public', 'workspace_memberships', 'user_id', 'uuid'::text,
  'membership user_id uses uuid'
);
select col_type_is(
  'public', 'workspace_memberships', 'role', 'text'::text,
  'membership role uses text'
);
select col_type_is(
  'public',
  'workspace_memberships',
  'created_at',
  'timestamp with time zone'::text,
  'membership created_at uses timestamptz'
);
select col_not_null(
  'public', 'workspace_memberships', 'workspace_id',
  'membership workspace_id is required'
);
select col_not_null(
  'public', 'workspace_memberships', 'user_id', 'membership user_id is required'
);
select col_not_null(
  'public', 'workspace_memberships', 'role', 'membership role is required'
);
select col_default_is(
  'public',
  'workspace_memberships',
  'role',
  'owner'::text,
  'membership role defaults to owner'
);

select has_pk('public', 'profiles', 'profiles has a primary key');
select has_pk('public', 'workspaces', 'workspaces has a primary key');
select has_pk(
  'public',
  'workspace_memberships',
  'workspace_memberships has a composite primary key'
);
select has_fk('public', 'profiles', 'profiles references auth.users');
select has_fk(
  'public',
  'workspace_memberships',
  'workspace_memberships has foreign keys'
);
select is(
  (
    select count(*)::integer
    from pg_catalog.pg_constraint
    where conrelid = 'public.workspace_memberships'::regclass
      and contype = 'f'
  ),
  2,
  'workspace memberships has both required foreign keys'
);
select ok(
  not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid in (
      'public.profiles'::regclass,
      'public.workspaces'::regclass,
      'public.workspace_memberships'::regclass
    )
      and not convalidated
  ),
  'all Phase 1 constraints are validated'
);
select has_index(
  'public',
  'workspace_memberships',
  'workspace_memberships_one_owner_per_user',
  'one-owner-membership-per-user index exists'
);

select ok(
  (select relrowsecurity from pg_catalog.pg_class
   where oid = 'public.profiles'::regclass),
  'profiles has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class
   where oid = 'public.workspaces'::regclass),
  'workspaces has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class
   where oid = 'public.workspace_memberships'::regclass),
  'workspace_memberships has RLS enabled'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Users can view their own profile'
  ),
  'profile SELECT policy exists'
);
select ok(
  exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Users can update their own profile'
  ),
  'profile UPDATE policy exists'
);
select ok(
  exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'workspaces'
      and policyname = 'Members can view their workspace'
  ),
  'workspace SELECT policy exists'
);
select ok(
  exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'workspaces'
      and policyname = 'Owners can update their workspace'
  ),
  'workspace UPDATE policy exists'
);
select ok(
  exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'workspace_memberships'
      and policyname = 'Members can view memberships'
  ),
  'membership SELECT policy exists'
);

select ok(
  to_regprocedure(
    'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)'
  ) is not null,
  'authoritative onboarding RPC exists'
);
select is(
  (
    select procedure.pronargdefaults::integer
    from pg_catalog.pg_proc procedure
    where procedure.oid = to_regprocedure(
      'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)'
    )
  ),
  1,
  'business name is the one optional onboarding RPC argument'
);
select ok(
  to_regprocedure(
    'public.complete_onboarding(text,text,text,text,text,text,text)'
  ) is null,
  'obsolete onboarding RPC overload is absent'
);
select ok(
  to_regprocedure(
    'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],boolean,text,text,text)'
  ) is null,
  'coercible boolean onboarding RPC overload is absent'
);
select ok(
  to_regprocedure(
    'public.update_business_settings(text,text,text,text)'
  ) is not null,
  'business-settings RPC exists'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)',
    'EXECUTE'
  ),
  'anon cannot execute onboarding'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)',
    'EXECUTE'
  ),
  'authenticated can execute onboarding'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.update_business_settings(text,text,text,text)',
    'EXECUTE'
  ),
  'anon cannot execute business settings'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.update_business_settings(text,text,text,text)',
    'EXECUTE'
  ),
  'authenticated can execute business settings'
);
select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc procedure
    cross join lateral aclexplode(
      coalesce(procedure.proacl, acldefault('f', procedure.proowner))
    ) privilege
    where procedure.oid = to_regprocedure(
      'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)'
    )
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute onboarding'
);

select ok(
  (select procedure.prosecdef
   from pg_catalog.pg_proc procedure
   where procedure.oid = to_regprocedure(
     'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)'
   )),
  'onboarding RPC is explicitly security definer'
);
select ok(
  position(
    'search_path' in coalesce((
      select array_to_string(procedure.proconfig, ',')
      from pg_catalog.pg_proc procedure
      where procedure.oid = to_regprocedure(
        'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)'
      )
    ), '')
  ) > 0,
  'onboarding RPC pins search_path'
);
select ok(
  position('auth.uid()' in pg_get_functiondef(to_regprocedure(
    'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)'
  ))) > 0,
  'onboarding RPC derives identity from auth.uid()'
);
select ok(
  position('jsonb_typeof(p_accepted_terms)' in pg_get_functiondef(to_regprocedure(
    'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)'
  ))) > 0
  and position('p_accepted_terms <> ''true''::jsonb' in pg_get_functiondef(to_regprocedure(
    'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)'
  ))) > 0,
  'onboarding RPC requires the exact JSON boolean true'
);
select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc procedure,
      unnest(coalesce(procedure.proargnames, array[]::text[])) argument
    where procedure.oid in (
      to_regprocedure(
        'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)'
      ),
      to_regprocedure('public.update_business_settings(text,text,text,text)')
    )
      and argument in ('p_user_id', 'p_workspace_id', 'p_owner_id')
  ),
  'privileged RPCs accept no client-supplied user or workspace identity'
);
select ok(
  position('public.profiles' in pg_get_functiondef(to_regprocedure(
    'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)'
  ))) > 0
  and position('public.workspaces' in pg_get_functiondef(to_regprocedure(
    'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)'
  ))) > 0
  and position('public.workspace_memberships' in pg_get_functiondef(to_regprocedure(
    'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],jsonb,text,text,text)'
  ))) > 0,
  'onboarding RPC schema-qualifies protected relations'
);

select * from finish();
rollback;
