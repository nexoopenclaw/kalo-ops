-- Sprint 17 · Supabase backend foundation (multi-tenant + RLS)

create extension if not exists pgcrypto;

-- ---------- enums ----------
do $$ begin
  create type public.membership_role as enum ('owner', 'admin', 'setter', 'closer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deal_stage as enum ('new', 'qualified', 'booked', 'show', 'won', 'lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.automation_trigger_type as enum ('silence', 'keyword', 'stage_change', 'booking', 'payment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.webhook_status as enum ('processed', 'retrying', 'failed_permanent');
exception when duplicate_object then null; end $$;

-- ---------- core tenant/auth ----------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- ---------- CRM ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assigned_to_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  source text not null default 'manual',
  score integer not null default 0,
  tags text[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  assigned_to_user_id uuid references auth.users(id) on delete set null,
  channel text not null,
  status text not null default 'open',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  direction text not null check(direction in ('inbound','outbound','internal')),
  body text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  stage public.deal_stage not null default 'new',
  value numeric(12,2) not null default 0,
  currency text not null default 'USD',
  notes text not null default '',
  objections text[] not null default '{}',
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_stage_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  from_stage public.deal_stage,
  to_stage public.deal_stage not null,
  changed_by_user_id uuid references auth.users(id) on delete set null,
  reason text,
  note text,
  changed_at timestamptz not null default now()
);

-- ---------- automations ----------
create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  trigger_type public.automation_trigger_type not null,
  trigger_value text,
  trigger_window_minutes integer,
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  execution_count integer not null default 0,
  last_run_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  automation_id uuid not null references public.automations(id) on delete cascade,
  status text not null check(status in ('success','failed','skipped')),
  summary text not null,
  context jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now()
);

create table if not exists public.automation_queue (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  automation_id uuid not null references public.automations(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','running','failed','done')),
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  next_retry_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- webhooks ----------
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel text not null,
  external_id text not null,
  idempotency_key text not null,
  payload_json jsonb not null default '{}'::jsonb,
  normalized_payload jsonb not null default '{}'::jsonb,
  processing_log jsonb not null default '[]'::jsonb,
  status public.webhook_status not null default 'processed',
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  next_attempt_at timestamptz,
  latency_ms integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table if not exists public.dead_letter_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  webhook_event_id uuid not null references public.webhook_events(id) on delete cascade,
  reason text not null,
  requeued_at timestamptz,
  created_at timestamptz not null default now(),
  unique (webhook_event_id)
);

-- ---------- attribution/reporting ----------
create table if not exists public.content_pieces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  platform text not null,
  type text not null,
  hook text not null,
  angle text not null,
  published_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.content_attributions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  content_piece_id uuid not null references public.content_pieces(id) on delete cascade,
  call_booked boolean not null default false,
  deal_won boolean not null default false,
  attributed_revenue numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.alert_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rule_type text not null,
  enabled boolean not null default true,
  threshold integer not null default 1,
  window text not null default '24h',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, rule_type)
);

create table if not exists public.reports_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_type text not null,
  period_label text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists idx_memberships_user_org on public.memberships(user_id, organization_id);
create index if not exists idx_leads_org_created_at on public.leads(organization_id, created_at desc);
create index if not exists idx_leads_org_assigned on public.leads(organization_id, assigned_to_user_id);
create index if not exists idx_conversations_org_last_message on public.conversations(organization_id, last_message_at desc);
create index if not exists idx_messages_org_conv_created on public.messages(organization_id, conversation_id, created_at desc);
create index if not exists idx_deals_org_stage on public.deals(organization_id, stage);
create index if not exists idx_deals_org_owner on public.deals(organization_id, owner_user_id);
create index if not exists idx_deal_stage_history_deal_changed on public.deal_stage_history(deal_id, changed_at desc);
create index if not exists idx_automations_org_active on public.automations(organization_id, active);
create index if not exists idx_automation_exec_org_started on public.automation_executions(organization_id, started_at desc);
create index if not exists idx_automation_queue_org_status on public.automation_queue(organization_id, status, next_retry_at);
create index if not exists idx_webhook_events_org_created on public.webhook_events(organization_id, created_at desc);
create index if not exists idx_webhook_events_org_status on public.webhook_events(organization_id, status);
create index if not exists idx_dead_letter_org_created on public.dead_letter_events(organization_id, created_at desc);

-- ---------- helper functions ----------
create or replace function public.app_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function public.app_active_org_id()
returns uuid
language plpgsql
stable
as $$
declare
  from_claim text;
  resolved uuid;
begin
  from_claim := nullif(auth.jwt() ->> 'org_id', '');
  if from_claim is not null then
    return from_claim::uuid;
  end if;

  select m.organization_id into resolved
  from public.memberships m
  where m.user_id = auth.uid() and m.is_active = true
  order by m.created_at asc
  limit 1;

  return resolved;
end;
$$;

create or replace function public.app_has_role(org_id uuid, allowed public.membership_role[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.is_active = true
      and m.role = any(allowed)
  );
$$;

create or replace function public.app_is_member(org_id uuid)
returns boolean
language sql
stable
as $$
  select public.app_has_role(org_id, array['owner','admin','setter','closer']::public.membership_role[]);
$$;

-- ---------- RLS ----------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.deals enable row level security;
alter table public.deal_stage_history enable row level security;
alter table public.automations enable row level security;
alter table public.automation_executions enable row level security;
alter table public.automation_queue enable row level security;
alter table public.webhook_events enable row level security;
alter table public.dead_letter_events enable row level security;
alter table public.content_pieces enable row level security;
alter table public.content_attributions enable row level security;
alter table public.alert_configs enable row level security;
alter table public.reports_snapshots enable row level security;

-- drop previous possibly conflicting policy names
 drop policy if exists org_select_member on public.organizations;
 drop policy if exists org_insert_owner on public.organizations;
 drop policy if exists org_update_owner on public.organizations;
 drop policy if exists profile_select_self on public.profiles;
 drop policy if exists profile_insert_self on public.profiles;
 drop policy if exists profile_update_self on public.profiles;
 drop policy if exists membership_select_member on public.memberships;
 drop policy if exists membership_insert_owner on public.memberships;
 drop policy if exists membership_update_owner on public.memberships;
 drop policy if exists lead_select_member on public.leads;
 drop policy if exists lead_insert_member on public.leads;
 drop policy if exists lead_update_member on public.leads;
 drop policy if exists lead_delete_owner on public.leads;

create policy organizations_member_select on public.organizations for select using (public.app_is_member(id));
create policy organizations_owner_admin_mutate on public.organizations for all using (public.app_has_role(id, array['owner','admin']::public.membership_role[])) with check (public.app_has_role(id, array['owner','admin']::public.membership_role[]));

create policy profiles_self_select on public.profiles for select using (id = auth.uid());
create policy profiles_self_insert on public.profiles for insert with check (id = auth.uid());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy memberships_select_same_org on public.memberships for select using (public.app_is_member(organization_id));
create policy memberships_owner_admin_mutate on public.memberships for all using (public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])) with check (public.app_has_role(organization_id, array['owner','admin']::public.membership_role[]));

create policy leads_select_member on public.leads for select using (public.app_is_member(organization_id));
create policy leads_insert_member on public.leads for insert with check (public.app_is_member(organization_id));
create policy leads_update_scoped on public.leads for update using (
  public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])
  or (public.app_has_role(organization_id, array['setter']::public.membership_role[]) and (assigned_to_user_id is null or assigned_to_user_id = auth.uid()))
  or (public.app_has_role(organization_id, array['closer']::public.membership_role[]) and assigned_to_user_id = auth.uid())
) with check (
  public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])
  or (public.app_has_role(organization_id, array['setter']::public.membership_role[]) and (assigned_to_user_id is null or assigned_to_user_id = auth.uid()))
  or (public.app_has_role(organization_id, array['closer']::public.membership_role[]) and assigned_to_user_id = auth.uid())
);

create policy conversations_select_member on public.conversations for select using (public.app_is_member(organization_id));
create policy conversations_mutate_scoped on public.conversations for all using (
  public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])
  or (public.app_has_role(organization_id, array['setter','closer']::public.membership_role[]) and (assigned_to_user_id is null or assigned_to_user_id = auth.uid()))
) with check (
  public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])
  or (public.app_has_role(organization_id, array['setter','closer']::public.membership_role[]) and (assigned_to_user_id is null or assigned_to_user_id = auth.uid()))
);

create policy messages_select_member on public.messages for select using (public.app_is_member(organization_id));
create policy messages_insert_scoped on public.messages for insert with check (
  public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])
  or public.app_has_role(organization_id, array['setter','closer']::public.membership_role[])
);
create policy messages_update_owner_admin on public.messages for update using (public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])) with check (public.app_has_role(organization_id, array['owner','admin']::public.membership_role[]));

create policy deals_select_member on public.deals for select using (public.app_is_member(organization_id));
create policy deals_insert_member on public.deals for insert with check (public.app_has_role(organization_id, array['owner','admin','setter']::public.membership_role[]));
create policy deals_update_scoped on public.deals for update using (
  public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])
  or (public.app_has_role(organization_id, array['setter']::public.membership_role[]) and (owner_user_id is null or owner_user_id = auth.uid()))
  or (public.app_has_role(organization_id, array['closer']::public.membership_role[]) and owner_user_id = auth.uid())
) with check (
  public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])
  or (public.app_has_role(organization_id, array['setter']::public.membership_role[]) and (owner_user_id is null or owner_user_id = auth.uid()))
  or (public.app_has_role(organization_id, array['closer']::public.membership_role[]) and owner_user_id = auth.uid())
);

create policy deal_stage_history_select_member on public.deal_stage_history for select using (public.app_is_member(organization_id));
create policy deal_stage_history_insert_scoped on public.deal_stage_history for insert with check (public.app_has_role(organization_id, array['owner','admin','setter','closer']::public.membership_role[]));

create policy automations_owner_admin on public.automations for all using (public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])) with check (public.app_has_role(organization_id, array['owner','admin']::public.membership_role[]));
create policy automation_executions_select_member on public.automation_executions for select using (public.app_is_member(organization_id));
create policy automation_executions_insert_ops on public.automation_executions for insert with check (public.app_has_role(organization_id, array['owner','admin','setter','closer']::public.membership_role[]));
create policy automation_queue_owner_admin on public.automation_queue for all using (public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])) with check (public.app_has_role(organization_id, array['owner','admin']::public.membership_role[]));

create policy webhook_events_member on public.webhook_events for select using (public.app_is_member(organization_id));
create policy webhook_events_mutate_admin on public.webhook_events for all using (public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])) with check (public.app_has_role(organization_id, array['owner','admin']::public.membership_role[]));
create policy dead_letter_member on public.dead_letter_events for select using (public.app_is_member(organization_id));
create policy dead_letter_admin on public.dead_letter_events for all using (public.app_has_role(organization_id, array['owner','admin']::public.membership_role[])) with check (public.app_has_role(organization_id, array['owner','admin']::public.membership_role[]));

create policy content_pieces_member on public.content_pieces for all using (public.app_is_member(organization_id)) with check (public.app_is_member(organization_id));
create policy content_attr_member on public.content_attributions for all using (public.app_is_member(organization_id)) with check (public.app_is_member(organization_id));
create policy alert_configs_member on public.alert_configs for all using (public.app_is_member(organization_id)) with check (public.app_is_member(organization_id));
create policy report_snapshots_member on public.reports_snapshots for all using (public.app_is_member(organization_id)) with check (public.app_is_member(organization_id));
