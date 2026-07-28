begin;

alter table public.profiles
  add column if not exists avatar_path text,
  add column if not exists theme_preference text not null default 'system',
  add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_theme_preference_check;

alter table public.profiles
  add constraint profiles_theme_preference_check
  check (theme_preference in ('light', 'dark', 'system'));

comment on column public.profiles.business_name is
  'Deprecated Phase 0 field. Canonical business data belongs to workspaces.';
comment on column public.profiles.country_code is
  'Deprecated Phase 0 field. Canonical country belongs to workspaces.';
comment on column public.profiles.currency_code is
  'Deprecated Phase 0 field. Canonical currency belongs to workspaces.';
comment on column public.profiles.timezone is
  'Deprecated Phase 0 field. Canonical time zone belongs to workspaces.';
comment on column public.profiles.avatar_url is
  'Deprecated Phase 0 field. Reserved avatar_path is not exposed in Phase 1.';

create or replace function public.is_iso_country_code(candidate text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select candidate = any (array[
    'AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ',
    'BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ',
    'CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ',
    'DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR',
    'GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY',
    'HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP',
    'KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY',
    'MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ',
    'NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY',
    'QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ',
    'TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ',
    'UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'
  ]::text[]);
$$;

create or replace function public.is_iso_currency_code(candidate text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select candidate = any (array[
    'AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN','BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD',
    'CAD','CDF','CHF','CLP','CNY','COP','CRC','CUC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP','ERN','ETB','EUR','FJD','FKP','GBP','GEL','GHS','GIP',
    'GMD','GNF','GTQ','GYD','HKD','HNL','HRK','HTG','HUF','IDR','ILS','INR','IQD','IRR','ISK','JMD','JOD','JPY','KES','KGS','KHR','KMF','KPW','KRW','KWD',
    'KYD','KZT','LAK','LBP','LKR','LRD','LSL','LYD','MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO',
    'NOK','NPR','NZD','OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG','QAR','RON','RSD','RUB','RWF','SAR','SBD','SCR','SDG','SEK','SGD','SHP','SLE','SLL',
    'SOS','SRD','SSP','STN','SVC','SYP','SZL','THB','TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS','UAH','UGX','USD','UYU','UZS','VES','VND','VUV','WST',
    'XAF','XCD','XCG','XDR','XOF','XPF','XSU','YER','ZAR','ZMW','ZWG','ZWL'
  ]::text[]);
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  business_type text check (
    business_type is null or char_length(business_type) between 1 and 80
  ),
  country_code text not null check (public.is_iso_country_code(country_code)),
  default_currency text not null check (public.is_iso_currency_code(default_currency)),
  locale text not null check (char_length(locale) between 2 and 35),
  time_zone text not null check (char_length(time_zone) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role = 'owner'),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create unique index if not exists workspace_memberships_one_owner_per_user
  on public.workspace_memberships (user_id)
  where role = 'owner';

create index if not exists workspace_memberships_workspace_id_idx
  on public.workspace_memberships (workspace_id);

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(requested_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_memberships membership
    where membership.workspace_id = requested_workspace_id
      and membership.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_workspace_owner(requested_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_memberships membership
    where membership.workspace_id = requested_workspace_id
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public, anon;
revoke all on function public.is_workspace_owner(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;

drop policy if exists "Members can view their workspace" on public.workspaces;
drop policy if exists "Owners can update their workspace" on public.workspaces;
drop policy if exists "Members can view memberships" on public.workspace_memberships;

create policy "Members can view their workspace"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

create policy "Owners can update their workspace"
on public.workspaces
for update
to authenticated
using (public.is_workspace_owner(id))
with check (public.is_workspace_owner(id));

create policy "Members can view memberships"
on public.workspace_memberships
for select
to authenticated
using (public.is_workspace_member(workspace_id));

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, theme_preference) on table public.profiles to authenticated;

revoke all on table public.workspaces from anon, authenticated;
grant select on table public.workspaces to authenticated;
grant update (
  name,
  business_type,
  country_code,
  default_currency,
  locale,
  time_zone
) on table public.workspaces to authenticated;

revoke all on table public.workspace_memberships from anon, authenticated;
grant select on table public.workspace_memberships to authenticated;

grant select, insert, update, delete on table public.workspaces to service_role;
grant select, insert, update, delete on table public.workspace_memberships to service_role;

create or replace function public.complete_onboarding(
  p_display_name text,
  p_workspace_name text,
  p_business_type text,
  p_country_code text,
  p_default_currency text,
  p_locale text,
  p_time_zone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  selected_workspace_id uuid;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  p_display_name := btrim(p_display_name);
  p_workspace_name := btrim(p_workspace_name);
  p_business_type := nullif(btrim(p_business_type), '');
  p_country_code := upper(btrim(p_country_code));
  p_default_currency := upper(btrim(p_default_currency));
  p_locale := btrim(p_locale);
  p_time_zone := btrim(p_time_zone);

  if char_length(p_display_name) not between 2 and 80
    or char_length(p_workspace_name) not between 2 and 100
    or (p_business_type is not null and char_length(p_business_type) not between 1 and 80)
    or not public.is_iso_country_code(p_country_code)
    or not public.is_iso_currency_code(p_default_currency)
    or char_length(p_locale) not between 2 and 35
    or char_length(p_time_zone) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'Invalid onboarding values';
  end if;

  select membership.workspace_id
  into selected_workspace_id
  from public.workspace_memberships membership
  where membership.user_id = current_user_id
    and membership.role = 'owner'
  limit 1;

  if selected_workspace_id is null then
    begin
      insert into public.workspaces (
        name,
        business_type,
        country_code,
        default_currency,
        locale,
        time_zone
      )
      values (
        p_workspace_name,
        p_business_type,
        p_country_code,
        p_default_currency,
        p_locale,
        p_time_zone
      )
      returning id into selected_workspace_id;

      insert into public.workspace_memberships (workspace_id, user_id, role)
      values (selected_workspace_id, current_user_id, 'owner');
    exception
      when unique_violation then
        select membership.workspace_id
        into selected_workspace_id
        from public.workspace_memberships membership
        where membership.user_id = current_user_id
          and membership.role = 'owner'
        limit 1;
    end;
  end if;

  if selected_workspace_id is null then
    raise exception using errcode = 'P0001', message = 'Workspace setup could not be completed';
  end if;

  update public.workspaces
  set
    name = p_workspace_name,
    business_type = p_business_type,
    country_code = p_country_code,
    default_currency = p_default_currency,
    locale = p_locale,
    time_zone = p_time_zone
  where id = selected_workspace_id;

  insert into public.profiles (
    id,
    display_name,
    onboarding_completed,
    onboarding_completed_at
  )
  values (current_user_id, p_display_name, true, now())
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    onboarding_completed = true,
    onboarding_completed_at = coalesce(
      public.profiles.onboarding_completed_at,
      excluded.onboarding_completed_at
    );

  return selected_workspace_id;
end;
$$;

revoke all on function public.complete_onboarding(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public, anon;

grant execute on function public.complete_onboarding(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;

create or replace function public.update_preferences(
  p_default_currency text,
  p_locale text,
  p_time_zone text,
  p_theme_preference text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  selected_workspace_id uuid;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  p_default_currency := upper(btrim(p_default_currency));
  p_locale := btrim(p_locale);
  p_time_zone := btrim(p_time_zone);
  p_theme_preference := btrim(p_theme_preference);

  if not public.is_iso_currency_code(p_default_currency)
    or char_length(p_locale) not between 2 and 35
    or char_length(p_time_zone) not between 1 and 100
    or p_theme_preference not in ('light', 'dark', 'system') then
    raise exception using errcode = '22023', message = 'Invalid preference values';
  end if;

  select membership.workspace_id
  into selected_workspace_id
  from public.workspace_memberships membership
  where membership.user_id = current_user_id
    and membership.role = 'owner'
  limit 1;

  if selected_workspace_id is null then
    raise exception using errcode = '42501', message = 'Workspace ownership required';
  end if;

  update public.workspaces
  set
    default_currency = p_default_currency,
    locale = p_locale,
    time_zone = p_time_zone
  where id = selected_workspace_id;

  update public.profiles
  set theme_preference = p_theme_preference
  where id = current_user_id;
end;
$$;

revoke all on function public.update_preferences(text, text, text, text)
from public, anon;
grant execute on function public.update_preferences(text, text, text, text)
to authenticated;

revoke execute on function public.handle_new_user()
from public, anon, authenticated;

commit;
