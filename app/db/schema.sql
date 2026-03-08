-- Kalo Ops · Sprint 2 schema enhancement (PostgreSQL / Supabase)
-- Credential-free, production-ready scaffolding for Inbox + Meta integration.

create extension if not exists "pgcrypto";

-- =====================================================
-- ORGANIZATIONS
-- =====================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- PROFILES (extends auth.users)
-- =====================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- MEMBERSHIPS
-- =====================================================
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'setter', 'closer', 'viewer')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- =====================================================
-- LEADS
-- =====================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  source text,
  status text not null default 'new' check (status in ('new', 'qualified', 'proposal', 'won', 'lost')),
  score int not null default 0,
  owner_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_org_status_idx on public.leads (organization_id, status);

-- =====================================================
-- INBOX STATUS ENUM
-- =====================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'conversation_status') then
    create type public.conversation_status as enum ('new', 'active', 'waiting_setter', 'waiting_lead', 'won', 'lost');
  end if;
end $$;

-- =====================================================
-- CONVERSATIONS + MESSAGES
-- =====================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel in ('instagram', 'whatsapp', 'email', 'webchat', 'other')),
  status public.conversation_status not null default 'new',
  assigned_setter_user_id uuid references auth.users(id),
  assigned_closer_user_id uuid references auth.users(id),
  external_thread_id text,
  unread_count int not null default 0 check (unread_count >= 0),
  has_no_reply boolean not null default false,
  sla_due_at timestamptz,
  sla_breached boolean not null default false,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe upgrades for existing Sprint 1 tables
alter table if exists public.conversations add column if not exists status public.conversation_status not null default 'new';
alter table if exists public.conversations add column if not exists assigned_setter_user_id uuid references auth.users(id);
alter table if exists public.conversations add column if not exists assigned_closer_user_id uuid references auth.users(id);
alter table if exists public.conversations add column if not exists unread_count int not null default 0;
alter table if exists public.conversations add column if not exists has_no_reply boolean not null default false;
alter table if exists public.conversations add column if not exists sla_due_at timestamptz;
alter table if exists public.conversations add column if not exists sla_breached boolean not null default false;
alter table if exists public.conversations add column if not exists last_inbound_at timestamptz;
alter table if exists public.conversations add column if not exists last_outbound_at timestamptz;
alter table if exists public.conversations add column if not exists updated_at timestamptz not null default now();

create index if not exists conversations_org_last_msg_idx on public.conversations (organization_id, last_message_at desc);
create index if not exists conversations_org_status_idx on public.conversations (organization_id, status);
create index if not exists conversations_org_setter_idx on public.conversations (organization_id, assigned_setter_user_id);
create index if not exists conversations_org_unread_idx on public.conversations (organization_id, unread_count desc);
create index if not exists conversations_org_sla_idx on public.conversations (organization_id, sla_due_at asc) where sla_due_at is not null;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('lead', 'agent', 'system')),
  sender_user_id uuid references auth.users(id),
  external_message_id text,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now()
);

alter table if exists public.messages add column if not exists external_message_id text;

create index if not exists messages_conversation_sent_idx on public.messages (conversation_id, sent_at);
create index if not exists messages_org_sent_idx on public.messages (organization_id, sent_at desc);
create index if not exists messages_external_message_id_idx on public.messages (external_message_id);

-- =====================================================
-- DEALS
-- =====================================================
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  name text not null,
  stage text not null default 'new' check (stage in ('new', 'qualified', 'booked', 'show', 'won', 'lost')),
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  close_date date,
  owner_user_id uuid references auth.users(id),
  next_step text,
  last_activity_at timestamptz,
  booked_at timestamptz,
  show_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table if exists public.deals add column if not exists last_activity_at timestamptz;
alter table if exists public.deals add column if not exists booked_at timestamptz;
alter table if exists public.deals add column if not exists show_at timestamptz;
alter table if exists public.deals add column if not exists won_at timestamptz;
alter table if exists public.deals add column if not exists lost_at timestamptz;

create index if not exists deals_org_stage_idx on public.deals (organization_id, stage);
create index if not exists deals_org_owner_idx on public.deals (organization_id, owner_user_id);
create index if not exists deals_org_last_activity_idx on public.deals (organization_id, last_activity_at desc);

-- Stage change audit trail (pipeline observability)
create table if not exists public.deal_stage_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  from_stage text not null,
  to_stage text not null,
  changed_by_user_id uuid references auth.users(id),
  reason text,
  note text,
  changed_at timestamptz not null default now()
);

alter table if exists public.deal_stage_history add column if not exists note text;

create index if not exists deal_stage_history_deal_changed_idx on public.deal_stage_history (deal_id, changed_at desc);
create index if not exists deal_stage_history_org_changed_idx on public.deal_stage_history (organization_id, changed_at desc);

-- Objections strategy: relational table for reporting + optional denormalized cache in deals.metadata JSONB.
create table if not exists public.deal_objections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  objection text not null,
  status text not null default 'open' check (status in ('open', 'handled', 'ignored')),
  created_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deal_objections_deal_status_idx on public.deal_objections (deal_id, status);
create index if not exists deal_objections_org_created_idx on public.deal_objections (organization_id, created_at desc);

-- =====================================================
-- RLS BASELINE + POLICY STUBS
-- =====================================================
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.deals enable row level security;
alter table public.deal_stage_history enable row level security;
alter table public.deal_objections enable row level security;

-- organizations
-- create policy org_select on public.organizations
--   for select using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = organizations.id
--       and m.user_id = auth.uid()
--     )
--   );

-- profiles
-- create policy profile_self_select on public.profiles
--   for select using (id = auth.uid());

-- memberships
-- create policy memberships_org_scope on public.memberships
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = memberships.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- leads
-- create policy leads_org_scope on public.leads
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = leads.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- conversations
-- create policy conversations_org_scope on public.conversations
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = conversations.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- messages
-- create policy messages_org_scope on public.messages
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = messages.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- deals
-- create policy deals_org_scope on public.deals
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = deals.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- deal_stage_history
-- create policy deal_stage_history_org_scope on public.deal_stage_history
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = deal_stage_history.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- deal_objections
-- create policy deal_objections_org_scope on public.deal_objections
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = deal_objections.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- =====================================================
-- AUTOMATIONS ENGINE (Sprint 6 scaffold)
-- =====================================================
create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  trigger_type text not null check (trigger_type in ('silence', 'keyword', 'stage_change', 'booking', 'payment')),
  trigger_config jsonb not null default '{}'::jsonb,
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  execution_count int not null default 0,
  last_run_at timestamptz,
  created_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  automation_id uuid not null references public.automations(id) on delete cascade,
  status text not null check (status in ('success', 'failed', 'skipped')),
  summary text,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists automations_org_active_idx on public.automations (organization_id, active);
create index if not exists automations_org_updated_idx on public.automations (organization_id, updated_at desc);
create index if not exists automation_logs_org_started_idx on public.automation_logs (organization_id, started_at desc);
create index if not exists automation_logs_automation_started_idx on public.automation_logs (automation_id, started_at desc);

alter table public.automations enable row level security;
alter table public.automation_logs enable row level security;

-- automations
-- create policy automations_org_scope on public.automations
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = automations.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- automation_logs
-- create policy automation_logs_org_scope on public.automation_logs
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = automation_logs.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- Optional trigger pattern: keep updated_at fresh via trigger before update.
