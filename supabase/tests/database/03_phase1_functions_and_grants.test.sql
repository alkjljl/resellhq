begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_function('public', 'set_updated_at', array[]::text[]);
select has_function('public', 'handle_new_user', array[]::text[]);
select has_function('public', 'is_workspace_member', array['uuid']);
select has_function('public', 'is_workspace_owner', array['uuid']);
select has_function(
  'public',
  'update_preferences',
  array['text', 'text', 'text', 'text']
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and tgname = 'set_profiles_updated_at'
      and not tgisinternal
  ),
  'profile updated_at trigger exists'
);
select ok(
  exists (
    select 1
    from pg_catalog.pg_trigger
    where tgrelid = 'public.workspaces'::regclass
      and tgname = 'set_workspaces_updated_at'
      and not tgisinternal
  ),
  'workspace updated_at trigger exists'
);
select ok(
  exists (
    select 1
    from pg_catalog.pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'on_auth_user_created'
      and not tgisinternal
  ),
  'auth-user profile trigger exists'
);

select ok(
  not has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE')
  and not has_function_privilege(
    'authenticated',
    'public.handle_new_user()',
    'EXECUTE'
  ),
  'profile-creation trigger function is not directly executable by API roles'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.update_preferences(text,text,text,text)',
    'EXECUTE'
  )
  and has_function_privilege(
    'authenticated',
    'public.update_preferences(text,text,text,text)',
    'EXECUTE'
  ),
  'only authenticated users can execute preference settings'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.update_business_settings(text,text,text,text)',
    'EXECUTE'
  )
  and has_function_privilege(
    'authenticated',
    'public.update_business_settings(text,text,text,text)',
    'EXECUTE'
  ),
  'only authenticated users can execute business settings'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc procedure
    cross join lateral aclexplode(
      coalesce(procedure.proacl, acldefault('f', procedure.proowner))
    ) privilege
    where procedure.oid in (
      to_regprocedure('public.update_business_settings(text,text,text,text)'),
      to_regprocedure('public.update_preferences(text,text,text,text)')
    )
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute settings functions'
);

select ok(
  (
    select bool_and(procedure.prosecdef)
    from pg_catalog.pg_proc procedure
    where procedure.oid in (
      to_regprocedure(
        'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],boolean,text,text,text)'
      ),
      to_regprocedure('public.update_business_settings(text,text,text,text)'),
      to_regprocedure('public.update_preferences(text,text,text,text)')
    )
  ),
  'all privileged application mutations are security definer functions'
);
select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc procedure
    where procedure.oid in (
      to_regprocedure(
        'public.complete_onboarding(text,text,text,text,text,text,text[],text,text[],boolean,text,text,text)'
      ),
      to_regprocedure('public.update_business_settings(text,text,text,text)'),
      to_regprocedure('public.update_preferences(text,text,text,text)'),
      to_regprocedure('public.handle_new_user()'),
      to_regprocedure('public.set_updated_at()')
    )
      and not exists (
        select 1
        from unnest(coalesce(procedure.proconfig, array[]::text[])) as config(setting)
        where split_part(setting, '=', 1) = 'search_path'
          and btrim(split_part(setting, '=', 2), '"') = ''
      )
  ),
  'security-sensitive functions pin an empty search path'
);
select ok(
  position(
    'auth.uid()' in pg_get_functiondef(
      to_regprocedure('public.update_business_settings(text,text,text,text)')
    )
  ) > 0
  and position(
    'auth.uid()' in pg_get_functiondef(
      to_regprocedure('public.update_preferences(text,text,text,text)')
    )
  ) > 0,
  'settings functions derive the acting user from auth.uid()'
);

select ok(
  has_table_privilege('authenticated', 'public.profiles', 'SELECT')
  and not has_table_privilege('authenticated', 'public.profiles', 'INSERT')
  and not has_table_privilege('authenticated', 'public.profiles', 'DELETE'),
  'authenticated profile table privileges are least-privilege'
);
select ok(
  has_table_privilege('authenticated', 'public.workspaces', 'SELECT')
  and not has_table_privilege('authenticated', 'public.workspaces', 'INSERT')
  and not has_table_privilege('authenticated', 'public.workspaces', 'DELETE'),
  'authenticated workspace table privileges are least-privilege'
);
select ok(
  has_table_privilege(
    'authenticated',
    'public.workspace_memberships',
    'SELECT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.workspace_memberships',
    'INSERT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.workspace_memberships',
    'UPDATE'
  )
  and not has_table_privilege(
    'authenticated',
    'public.workspace_memberships',
    'DELETE'
  ),
  'authenticated membership table privileges are read-only'
);

select * from finish();
rollback;
