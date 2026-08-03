begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'phase1-a@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'phase1-b@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('30000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
   'phase1-member@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.workspaces (
  id, name, business_type, country_code, default_currency, locale, time_zone
)
values
  ('a0000000-0000-4000-8000-000000000001', 'Workspace A',
   'Independent reseller', 'DE', 'EUR', 'de-DE', 'Europe/Berlin'),
  ('b0000000-0000-4000-8000-000000000002', 'Workspace B',
   'Independent reseller', 'US', 'USD', 'en-US', 'America/New_York');

insert into public.workspace_memberships (workspace_id, user_id, role)
values
  ('a0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001', 'owner'),
  ('b0000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000002', 'owner'),
  ('a0000000-0000-4000-8000-000000000001',
   '30000000-0000-4000-8000-000000000003', 'owner');

update public.profiles
set display_name = case id
  when '10000000-0000-4000-8000-000000000001' then 'User A'
  when '20000000-0000-4000-8000-000000000002' then 'User B'
  else 'Same workspace member'
end;

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
set local role authenticated;

select results_eq(
  $$select id from public.profiles order by id$$,
  $$values ('10000000-0000-4000-8000-000000000001'::uuid)$$,
  'User A reads only their profile'
);
select results_eq(
  $$select id from public.profiles where id = '20000000-0000-4000-8000-000000000002'$$,
  $$select null::uuid where false$$,
  'User A cannot read User B profile'
);
select lives_ok(
  $$update public.profiles set display_name = 'Blocked profile change'
    where id = '20000000-0000-4000-8000-000000000002'$$,
  'cross-user profile UPDATE is a safe no-op'
);
select throws_ok(
  $$insert into public.profiles (id) values ('20000000-0000-4000-8000-000000000002')$$,
  '42501', 'permission denied for table profiles',
  'User A cannot INSERT a profile for User B'
);
select throws_ok(
  $$delete from public.profiles where id = '20000000-0000-4000-8000-000000000002'$$,
  '42501', 'permission denied for table profiles',
  'User A cannot DELETE User B profile'
);

select results_eq(
  $$select id from public.workspaces order by id$$,
  $$values ('a0000000-0000-4000-8000-000000000001'::uuid)$$,
  'User A reads only Workspace A'
);
select lives_ok(
  $$update public.workspaces set name = 'Blocked workspace change'
    where id = 'b0000000-0000-4000-8000-000000000002'$$,
  'cross-workspace UPDATE is a safe no-op'
);
select throws_ok(
  $$insert into public.workspaces
    (name, country_code, default_currency, locale, time_zone)
    values ('Unauthorized', 'DE', 'EUR', 'de-DE', 'Europe/Berlin')$$,
  '42501', 'permission denied for table workspaces',
  'User A cannot INSERT a workspace directly'
);
select throws_ok(
  $$delete from public.workspaces
    where id = 'b0000000-0000-4000-8000-000000000002'$$,
  '42501', 'permission denied for table workspaces',
  'User A cannot DELETE Workspace B'
);

select results_eq(
  $$select user_id from public.workspace_memberships order by user_id$$,
  $$values
    ('10000000-0000-4000-8000-000000000001'::uuid),
    ('30000000-0000-4000-8000-000000000003'::uuid)$$,
  'User A can read memberships in their workspace only'
);
select throws_ok(
  $$insert into public.workspace_memberships (workspace_id, user_id, role)
    values ('b0000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000001', 'owner')$$,
  '42501', 'permission denied for table workspace_memberships',
  'User A cannot move themselves into Workspace B'
);
select throws_ok(
  $$update public.workspace_memberships
    set user_id = '20000000-0000-4000-8000-000000000002'
    where workspace_id = 'a0000000-0000-4000-8000-000000000001'
      and user_id = '10000000-0000-4000-8000-000000000001'$$,
  '42501', 'permission denied for table workspace_memberships',
  'User A cannot replace their membership user id'
);
select throws_ok(
  $$delete from public.workspace_memberships
    where workspace_id = 'b0000000-0000-4000-8000-000000000002'$$,
  '42501', 'permission denied for table workspace_memberships',
  'User A cannot DELETE Workspace B memberships'
);

reset role;
select is(
  (select display_name from public.profiles
   where id = '20000000-0000-4000-8000-000000000002'),
  'User B',
  'User B profile remained unchanged after User A attacks'
);
select is(
  (select name from public.workspaces
   where id = 'b0000000-0000-4000-8000-000000000002'),
  'Workspace B',
  'Workspace B remained unchanged after User A attacks'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-4000-8000-000000000002',
  true
);
set local role authenticated;
select results_eq(
  $$select id from public.profiles order by id$$,
  $$values ('20000000-0000-4000-8000-000000000002'::uuid)$$,
  'User B reads only their profile'
);
select results_eq(
  $$select id from public.workspaces order by id$$,
  $$values ('b0000000-0000-4000-8000-000000000002'::uuid)$$,
  'User B reads only Workspace B'
);
select lives_ok(
  $$update public.profiles set display_name = 'Blocked reverse change'
    where id = '10000000-0000-4000-8000-000000000001'$$,
  'User B cross-user update is a safe no-op'
);
select lives_ok(
  $$update public.workspaces set name = 'Blocked reverse workspace change'
    where id = 'a0000000-0000-4000-8000-000000000001'$$,
  'User B cross-workspace update is a safe no-op'
);

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-4000-8000-000000000003',
  true
);
set local role authenticated;
select results_eq(
  $$select id from public.workspaces order by id$$,
  $$values ('a0000000-0000-4000-8000-000000000001'::uuid)$$,
  'same-workspace member can read Workspace A'
);
select lives_ok(
  $$update public.workspaces set name = 'Workspace A authorized'
    where id = 'a0000000-0000-4000-8000-000000000001'$$,
  'same-workspace owner role can update Workspace A as designed'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.profiles$$,
  '42501', 'permission denied for table profiles',
  'anon cannot read profiles'
);
select throws_ok(
  $$select * from public.workspaces$$,
  '42501', 'permission denied for table workspaces',
  'anon cannot read workspaces'
);
select throws_ok(
  $$select * from public.workspace_memberships$$,
  '42501', 'permission denied for table workspace_memberships',
  'anon cannot read memberships'
);
select throws_ok(
  $$select public.complete_onboarding(
    'Anon', 'User', 'Independent reseller', 'Other', 'DE', 'EUR',
    array['DE'], 'Just starting', array['eBay'], to_jsonb(true), 'de-DE', 'Europe/Berlin', null
  )$$,
  '42501', 'permission denied for function complete_onboarding',
  'anon cannot execute privileged onboarding RPC'
);
select throws_ok(
  $$select public.update_business_settings(
    'Workspace', null, 'Independent reseller', 'DE'
  )$$,
  '42501', 'permission denied for function update_business_settings',
  'anon cannot execute privileged business-settings RPC'
);

reset role;
select is(
  (select display_name from public.profiles
   where id = '10000000-0000-4000-8000-000000000001'),
  'User A',
  'User A profile survived reverse attacks'
);
select is(
  (select count(*) from public.workspace_memberships
   where user_id = '10000000-0000-4000-8000-000000000001'),
  1::bigint,
  'User A still has exactly one membership'
);
select is(
  (select count(*) from public.workspace_memberships
   where user_id = '20000000-0000-4000-8000-000000000002'),
  1::bigint,
  'User B still has exactly one membership'
);

select * from finish();
rollback;
