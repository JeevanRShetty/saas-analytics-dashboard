-- Extensions
create extension if not exists "uuid-ossp";

-- Organizations
create table public.organizations (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),
  name        text not null,
  slug        text not null unique,
  plan        text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  settings    jsonb not null default '{}'
);
alter table public.organizations enable row level security;

create policy "org_members_can_read"
  on public.organizations for select
  using (id in (select organization_id from public.profiles where id = auth.uid()));

create policy "owners_can_update"
  on public.organizations for update
  using (id in (select organization_id from public.profiles where id = auth.uid() and role = 'owner'));

-- Profiles
create table public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  email                  text not null,
  full_name              text,
  avatar_url             text,
  role                   text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  organization_id        uuid not null references public.organizations(id) on delete cascade,
  onboarding_completed   boolean not null default false,
  preferences            jsonb not null default '{}'
);
alter table public.profiles enable row level security;

create policy "org_members_can_read_profiles"
  on public.profiles for select
  using (organization_id in (select organization_id from public.profiles where id = auth.uid()));

create policy "users_can_update_own_profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "admins_can_update_org_profiles"
  on public.profiles for update
  using (organization_id in (select organization_id from public.profiles where id = auth.uid() and role in ('owner', 'admin')));

-- Analytics events
create table public.analytics_events (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  event_type       text not null,
  user_id          uuid,
  session_id       text,
  properties       jsonb not null default '{}',
  page_url         text,
  referrer         text,
  country          text,
  device_type      text check (device_type in ('desktop', 'mobile', 'tablet'))
);
create index analytics_events_org_created_idx on public.analytics_events(organization_id, created_at desc);
create index analytics_events_type_idx on public.analytics_events(organization_id, event_type);
alter table public.analytics_events enable row level security;

create policy "org_members_can_read_events"
  on public.analytics_events for select
  using (organization_id in (select organization_id from public.profiles where id = auth.uid()));

-- Audit logs
create table public.audit_logs (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  actor_id         uuid not null,
  actor_email      text not null,
  action           text not null,
  resource_type    text not null,
  resource_id      text,
  metadata         jsonb not null default '{}',
  ip_address       text
);
create index audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);
alter table public.audit_logs enable row level security;

create policy "admins_can_read_audit_logs"
  on public.audit_logs for select
  using (organization_id in (select organization_id from public.profiles where id = auth.uid() and role in ('owner', 'admin')));

-- Notifications
create table public.notifications (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  type             text not null check (type in ('info', 'warning', 'error', 'success')),
  title            text not null,
  body             text not null,
  read             boolean not null default false,
  action_url       text,
  metadata         jsonb not null default '{}'
);
create index notifications_user_read_idx on public.notifications(user_id, read, created_at desc);
alter table public.notifications enable row level security;
alter publication supabase_realtime add table public.notifications;

create policy "users_can_read_own_notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "users_can_update_own_notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- AI insights
create table public.ai_insights (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  type             text not null check (type in ('anomaly', 'trend', 'recommendation', 'summary')),
  title            text not null,
  content          text not null,
  severity         text check (severity in ('low', 'medium', 'high')),
  metric_key       text,
  data_snapshot    jsonb not null default '{}',
  acknowledged     boolean not null default false
);
create index ai_insights_org_created_idx on public.ai_insights(organization_id, created_at desc);
alter table public.ai_insights enable row level security;

create policy "org_members_can_read_insights"
  on public.ai_insights for select
  using (organization_id in (select organization_id from public.profiles where id = auth.uid()));

create policy "org_members_can_acknowledge_insights"
  on public.ai_insights for update
  using (organization_id in (select organization_id from public.profiles where id = auth.uid()))
  with check (acknowledged = true);

-- Analytics summary RPC
create or replace function public.get_analytics_summary(
  org_id     uuid,
  start_date timestamptz,
  end_date   timestamptz
)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'total_events',     count(*),
    'unique_sessions',  count(distinct session_id),
    'unique_users',     count(distinct user_id),
    'top_pages', (
      select json_agg(p) from (
        select page_url as page, count(*) as views
        from public.analytics_events
        where organization_id = org_id
          and created_at between start_date and end_date
          and page_url is not null
        group by page_url
        order by views desc
        limit 10
      ) p
    ),
    'device_breakdown', (
      select json_agg(d) from (
        select
          coalesce(device_type, 'unknown') as device,
          count(*) as count,
          round(count(*) * 100.0 / nullif(sum(count(*)) over (), 0), 2) as percentage
        from public.analytics_events
        where organization_id = org_id
          and created_at between start_date and end_date
        group by device_type
      ) d
    ),
    'time_series', (
      select json_agg(t order by t.date) from (
        select
          date_trunc('day', created_at)::date::text as date,
          count(*) as events,
          count(distinct session_id) as sessions
        from public.analytics_events
        where organization_id = org_id
          and created_at between start_date and end_date
        group by date_trunc('day', created_at)
      ) t
    )
  ) into result
  from public.analytics_events
  where organization_id = org_id
    and created_at between start_date and end_date;

  return result;
end;
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  new_org_id uuid;
begin
  insert into public.organizations (name, slug)
  values (
    coalesce(new.raw_user_meta_data->>'organization_name', 'My Organization'),
    lower(replace(coalesce(new.raw_user_meta_data->>'organization_name', 'my-org-' || substr(new.id::text, 1, 8)), ' ', '-'))
  )
  returning id into new_org_id;

  insert into public.profiles (id, email, full_name, organization_id, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new_org_id,
    'owner'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
