begin;

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists accepted_terms boolean,
  add column if not exists completed_onboarding timestamptz;

alter table public.workspaces
  add column if not exists primary_category text,
  add column if not exists selling_markets text[],
  add column if not exists experience_level text,
  add column if not exists selling_channels text[];

update public.profiles
set completed_onboarding = onboarding_completed_at
where completed_onboarding is null
  and onboarding_completed is true
  and onboarding_completed_at is not null;

alter table public.profiles
  drop constraint if exists profiles_first_name_check,
  drop constraint if exists profiles_last_name_check,
  drop constraint if exists profiles_business_name_check,
  drop constraint if exists profiles_accepted_terms_check;

alter table public.profiles
  add constraint profiles_first_name_check
    check (first_name is null or char_length(first_name) between 1 and 80),
  add constraint profiles_last_name_check
    check (last_name is null or char_length(last_name) between 1 and 80),
  add constraint profiles_business_name_check
    check (business_name is null or char_length(business_name) between 1 and 100),
  add constraint profiles_accepted_terms_check
    check (accepted_terms is null or accepted_terms is true);

alter table public.workspaces
  drop constraint if exists workspaces_primary_category_check,
  drop constraint if exists workspaces_selling_markets_check,
  drop constraint if exists workspaces_experience_level_check,
  drop constraint if exists workspaces_selling_channels_check;

alter table public.workspaces
  add constraint workspaces_primary_category_check
    check (
      primary_category is null
      or char_length(primary_category) between 1 and 80
    ),
  add constraint workspaces_selling_markets_check
    check (
      selling_markets is null
      or (
        cardinality(selling_markets) > 0
        and array_position(selling_markets, null) is null
        and array_position(selling_markets, '') is null
      )
    ),
  add constraint workspaces_experience_level_check
    check (
      experience_level is null
      or char_length(experience_level) between 1 and 80
    ),
  add constraint workspaces_selling_channels_check
    check (
      selling_channels is null
      or (
        cardinality(selling_channels) > 0
        and array_position(selling_channels, null) is null
        and array_position(selling_channels, '') is null
      )
    );

comment on column public.profiles.business_name is
  'Optional customer-facing business name. Separate from the internal workspace name.';
comment on column public.profiles.accepted_terms is
  'True only when the user accepted the applicable terms during onboarding. Null denotes legacy or incomplete consent.';
comment on column public.profiles.completed_onboarding is
  'Canonical timestamp for new onboarding completions. Legacy completion remains readable through the former compatibility fields.';
comment on column public.workspaces.selling_markets is
  'Geographic ISO country codes in which the reseller operates.';
comment on column public.workspaces.selling_channels is
  'Platforms or selling methods used by the reseller.';

revoke all on function public.complete_onboarding(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public, anon, authenticated;

drop function public.complete_onboarding(
  text,
  text,
  text,
  text,
  text,
  text,
  text
);

create function public.complete_onboarding(
  p_first_name text,
  p_last_name text,
  p_business_type text,
  p_primary_category text,
  p_country_code text,
  p_default_currency text,
  p_selling_markets text[],
  p_experience_level text,
  p_selling_channels text[],
  p_accepted_terms boolean,
  p_locale text,
  p_time_zone text,
  p_business_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  selected_workspace_id uuid;
  completion_time timestamptz := now();
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  p_first_name := btrim(p_first_name);
  p_last_name := btrim(p_last_name);
  p_business_name := nullif(btrim(p_business_name), '');
  p_business_type := btrim(p_business_type);
  p_primary_category := btrim(p_primary_category);
  p_country_code := upper(btrim(p_country_code));
  p_default_currency := upper(btrim(p_default_currency));
  p_experience_level := btrim(p_experience_level);
  p_locale := btrim(p_locale);
  p_time_zone := btrim(p_time_zone);

  select array_agg(upper(btrim(market.value)) order by market.ordinality)
  into p_selling_markets
  from unnest(p_selling_markets) with ordinality as market(value, ordinality);

  select array_agg(btrim(channel.value) order by channel.ordinality)
  into p_selling_channels
  from unnest(p_selling_channels) with ordinality as channel(value, ordinality);

  if p_first_name is null
    or char_length(p_first_name) not between 1 and 80
    or p_last_name is null
    or char_length(p_last_name) not between 1 and 80
    or (p_business_name is not null and char_length(p_business_name) > 100)
    or p_business_type is null
    or char_length(p_business_type) not between 1 and 80
    or p_primary_category is null
    or char_length(p_primary_category) not between 1 and 80
    or p_country_code is null
    or public.is_iso_country_code(p_country_code) is not true
    or p_default_currency is null
    or public.is_iso_currency_code(p_default_currency) is not true
    or p_selling_markets is null
    or cardinality(p_selling_markets) = 0
    or exists (
      select 1
      from unnest(p_selling_markets) as market(value)
      where nullif(btrim(market.value), '') is null
        or not public.is_iso_country_code(upper(btrim(market.value)))
    )
    or p_experience_level is null
    or char_length(p_experience_level) not between 1 and 80
    or p_selling_channels is null
    or cardinality(p_selling_channels) = 0
    or exists (
      select 1
      from unnest(p_selling_channels) as channel(value)
      where nullif(btrim(channel.value), '') is null
    )
    or p_accepted_terms is distinct from true
    or p_locale is null
    or char_length(p_locale) not between 2 and 35
    or p_time_zone is null
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
        primary_category,
        country_code,
        default_currency,
        selling_markets,
        experience_level,
        selling_channels,
        locale,
        time_zone
      )
      values (
        'My workspace',
        p_business_type,
        p_primary_category,
        p_country_code,
        p_default_currency,
        p_selling_markets,
        p_experience_level,
        p_selling_channels,
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
    business_type = p_business_type,
    primary_category = p_primary_category,
    country_code = p_country_code,
    default_currency = p_default_currency,
    selling_markets = p_selling_markets,
    experience_level = p_experience_level,
    selling_channels = p_selling_channels,
    locale = p_locale,
    time_zone = p_time_zone
  where id = selected_workspace_id;

  insert into public.profiles (
    id,
    display_name,
    first_name,
    last_name,
    business_name,
    accepted_terms,
    completed_onboarding,
    onboarding_completed,
    onboarding_completed_at
  )
  values (
    current_user_id,
    concat_ws(' ', p_first_name, p_last_name),
    p_first_name,
    p_last_name,
    p_business_name,
    true,
    completion_time,
    true,
    completion_time
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    business_name = excluded.business_name,
    accepted_terms = true,
    completed_onboarding = coalesce(
      public.profiles.completed_onboarding,
      excluded.completed_onboarding
    ),
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
  text[],
  text,
  text[],
  boolean,
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
  text[],
  text,
  text[],
  boolean,
  text,
  text,
  text
) to authenticated;

create function public.update_business_settings(
  p_workspace_name text,
  p_business_name text,
  p_business_type text,
  p_country_code text
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

  p_workspace_name := btrim(p_workspace_name);
  p_business_name := nullif(btrim(p_business_name), '');
  p_business_type := btrim(p_business_type);
  p_country_code := upper(btrim(p_country_code));

  if p_workspace_name is null
    or char_length(p_workspace_name) not between 2 and 100
    or (p_business_name is not null and char_length(p_business_name) > 100)
    or p_business_type is null
    or char_length(p_business_type) not between 1 and 80
    or p_country_code is null
    or public.is_iso_country_code(p_country_code) is not true then
    raise exception using errcode = '22023', message = 'Invalid business settings';
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
    name = p_workspace_name,
    business_type = p_business_type,
    country_code = p_country_code
  where id = selected_workspace_id;

  update public.profiles
  set business_name = p_business_name
  where id = current_user_id;
end;
$$;

revoke all on function public.update_business_settings(text, text, text, text)
from public, anon;
grant execute on function public.update_business_settings(text, text, text, text)
to authenticated;

commit;
