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

create table if not exists public.automation_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  automation_id uuid references public.automations(id) on delete set null,
  workflow_name text not null,
  status text not null check (status in ('success', 'failed', 'skipped')),
  reason text,
  duration_ms int not null default 0 check (duration_ms >= 0),
  trigger_payload jsonb not null default '{}'::jsonb,
  action_results jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.automation_queue (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'running', 'failed', 'completed')),
  payload jsonb not null default '{}'::jsonb,
  retry_count int not null default 0 check (retry_count >= 0),
  max_retries int not null default 2 check (max_retries >= 0),
  last_error text,
  next_retry_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists automation_executions_org_started_idx on public.automation_executions (organization_id, started_at desc);
create index if not exists automation_executions_org_status_idx on public.automation_executions (organization_id, status, created_at desc);
create index if not exists automation_queue_org_status_idx on public.automation_queue (organization_id, status, updated_at desc);
create index if not exists automation_queue_retry_idx on public.automation_queue (organization_id, next_retry_at) where next_retry_at is not null;

alter table public.automations enable row level security;
alter table public.automation_logs enable row level security;
alter table public.automation_executions enable row level security;
alter table public.automation_queue enable row level security;

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

-- automation_executions
-- create policy automation_executions_org_scope on public.automation_executions
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = automation_executions.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- automation_queue
-- create policy automation_queue_org_scope on public.automation_queue
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = automation_queue.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- =====================================================
-- AI COPILOT AUDIT (Sprint 7 scaffold)
-- =====================================================
create table if not exists public.ai_interactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  conversation_id uuid references public.conversations(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  feature text not null check (feature in ('suggest', 'classify', 'summarize', 'score')),
  model_provider text not null default 'mock',
  model_name text,
  prompt_template_version text,
  request_meta jsonb not null default '{}'::jsonb,
  response_meta jsonb not null default '{}'::jsonb,
  latency_ms int,
  token_input int,
  token_output int,
  status text not null default 'success' check (status in ('success', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_interaction_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  interaction_id uuid not null references public.ai_interactions(id) on delete cascade,
  event_type text not null check (event_type in ('accepted_suggestion', 'edited_suggestion', 'dismissed_suggestion', 'manual_override')),
  actor_user_id uuid references auth.users(id),
  context_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_interactions_org_created_idx on public.ai_interactions (organization_id, created_at desc);
create index if not exists ai_interactions_feature_created_idx on public.ai_interactions (feature, created_at desc);
create index if not exists ai_interactions_conversation_idx on public.ai_interactions (conversation_id) where conversation_id is not null;
create index if not exists ai_interactions_deal_idx on public.ai_interactions (deal_id) where deal_id is not null;
create index if not exists ai_interaction_events_interaction_created_idx on public.ai_interaction_events (interaction_id, created_at desc);

alter table public.ai_interactions enable row level security;
alter table public.ai_interaction_events enable row level security;

-- ai_interactions
-- create policy ai_interactions_org_scope on public.ai_interactions
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = ai_interactions.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- ai_interaction_events
-- create policy ai_interaction_events_org_scope on public.ai_interaction_events
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = ai_interaction_events.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- Optional trigger pattern: keep updated_at fresh via trigger before update.

-- =====================================================
-- VOICE NOTES + A/B TESTING (Sprint 8 scaffold)
-- =====================================================
create table if not exists public.voice_consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  status text not null check (status in ('granted', 'revoked')),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.voice_notes_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  actor_user_id uuid references auth.users(id),
  voice_model_id text not null,
  source_text_hash text not null,
  preview_id text,
  provider text not null default 'mock',
  provider_message_id text,
  status text not null default 'sent' check (status in ('queued', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  name text not null,
  traffic_split_a int not null default 50 check (traffic_split_a between 5 and 95),
  variant_a jsonb not null,
  variant_b jsonb not null,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experiment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  variant text not null check (variant in ('A', 'B')),
  event_type text not null check (event_type in ('impression', 'reply', 'conversion')),
  weight int not null default 1 check (weight > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists voice_consents_org_lead_created_idx on public.voice_consents (organization_id, lead_id, created_at desc);
create index if not exists voice_notes_audit_org_created_idx on public.voice_notes_audit (organization_id, created_at desc);
create index if not exists voice_notes_audit_lead_created_idx on public.voice_notes_audit (lead_id, created_at desc);
create index if not exists experiments_org_status_created_idx on public.experiments (organization_id, status, created_at desc);
create index if not exists experiment_events_experiment_variant_idx on public.experiment_events (experiment_id, variant, created_at desc);
create index if not exists experiment_events_org_type_created_idx on public.experiment_events (organization_id, event_type, created_at desc);

alter table public.voice_consents enable row level security;
alter table public.voice_notes_audit enable row level security;
alter table public.experiments enable row level security;
alter table public.experiment_events enable row level security;

-- voice_consents
-- create policy voice_consents_org_scope on public.voice_consents
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = voice_consents.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- voice_notes_audit
-- create policy voice_notes_audit_org_scope on public.voice_notes_audit
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = voice_notes_audit.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- experiments
-- create policy experiments_org_scope on public.experiments
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = experiments.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- experiment_events
-- create policy experiment_events_org_scope on public.experiment_events
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = experiment_events.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- =====================================================
-- MULTICHANNEL EVENTS + OUTBOUND DELIVERY (Sprint 11 scaffold)
-- =====================================================
create table if not exists public.channel_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  channel text not null check (channel in ('instagram', 'whatsapp', 'email')),
  event_direction text not null default 'inbound' check (event_direction in ('inbound', 'outbound', 'system')),
  event_type text not null check (event_type in ('text', 'voice', 'image', 'system')),
  provider_event_id text,
  external_conversation_id text,
  sender_external_id text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'received' check (status in ('received', 'normalized', 'failed')),
  retry_count int not null default 0 check (retry_count >= 0),
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.outbound_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  channel text not null check (channel in ('instagram', 'whatsapp', 'email')),
  message_type text not null default 'text' check (message_type in ('text', 'voice', 'image', 'system')),
  recipient_external_id text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  provider_name text not null default 'mock',
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'retrying', 'delivered')),
  retry_count int not null default 0 check (retry_count >= 0),
  next_retry_at timestamptz,
  last_error text,
  queued_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists channel_events_org_received_idx on public.channel_events (organization_id, received_at desc);
create index if not exists channel_events_org_channel_status_idx on public.channel_events (organization_id, channel, status, created_at desc);
create index if not exists channel_events_provider_event_idx on public.channel_events (provider_event_id) where provider_event_id is not null;

create index if not exists outbound_messages_org_queued_idx on public.outbound_messages (organization_id, queued_at desc);
create index if not exists outbound_messages_org_channel_status_idx on public.outbound_messages (organization_id, channel, status, updated_at desc);
create index if not exists outbound_messages_retry_idx on public.outbound_messages (status, next_retry_at) where status in ('failed', 'retrying');
create index if not exists outbound_messages_provider_message_idx on public.outbound_messages (provider_message_id) where provider_message_id is not null;

alter table public.channel_events enable row level security;
alter table public.outbound_messages enable row level security;

-- channel_events
-- create policy channel_events_org_scope on public.channel_events
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = channel_events.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- outbound_messages
-- create policy outbound_messages_org_scope on public.outbound_messages
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = outbound_messages.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- =====================================================
-- CONTENT ATTRIBUTION + REPORTING (Sprint 10 scaffold)
-- =====================================================
create table if not exists public.content_pieces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'youtube', 'tiktok', 'linkedin', 'x')),
  content_type text not null check (content_type in ('reel', 'post', 'story', 'video', 'thread', 'newsletter')),
  hook text not null,
  angle text,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_attributions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  content_piece_id uuid not null references public.content_pieces(id) on delete cascade,
  touchpoint text not null default 'first_touch' check (touchpoint in ('first_touch', 'assisted', 'last_touch')),
  call_booked boolean not null default false,
  deal_won boolean not null default false,
  attributed_revenue numeric(12,2) not null default 0,
  confidence_score numeric(5,2) not null default 1.0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reports_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_type text not null check (report_type in ('daily_digest', 'weekly_review')),
  period_label text not null,
  payload jsonb not null default '{}'::jsonb,
  generated_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.alert_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rule_type text not null check (rule_type in ('vip_no_response', 'show_up_drop', 'inbound_spike', 'backlog')),
  enabled boolean not null default true,
  threshold numeric(12,2) not null default 0,
  rule_window text not null default '24h' check (rule_window in ('1h', '24h', '7d')),
  recipients jsonb not null default '[]'::jsonb,
  created_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, rule_type)
);

create index if not exists content_pieces_org_published_idx on public.content_pieces (organization_id, published_at desc);
create index if not exists content_pieces_org_platform_idx on public.content_pieces (organization_id, platform);
create index if not exists content_attributions_org_piece_idx on public.content_attributions (organization_id, content_piece_id, created_at desc);
create index if not exists content_attributions_org_lead_idx on public.content_attributions (organization_id, lead_id, created_at desc);
create index if not exists reports_snapshots_org_type_idx on public.reports_snapshots (organization_id, report_type, created_at desc);
create index if not exists alert_configs_org_enabled_idx on public.alert_configs (organization_id, enabled, updated_at desc);

alter table public.content_pieces enable row level security;
alter table public.content_attributions enable row level security;
alter table public.reports_snapshots enable row level security;
alter table public.alert_configs enable row level security;

-- content_pieces
-- create policy content_pieces_org_scope on public.content_pieces
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = content_pieces.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- content_attributions
-- create policy content_attributions_org_scope on public.content_attributions
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = content_attributions.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- reports_snapshots
-- create policy reports_snapshots_org_scope on public.reports_snapshots
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = reports_snapshots.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- alert_configs
-- create policy alert_configs_org_scope on public.alert_configs
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = alert_configs.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- =====================================================
-- WEBHOOK RELIABILITY ENGINE (Sprint 12 scaffold)
-- =====================================================
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel text not null check (channel in ('instagram', 'whatsapp', 'email')),
  external_id text not null,
  idempotency_key text not null unique,
  payload_json jsonb not null default '{}'::jsonb,
  status text not null default 'processed' check (status in ('processed', 'retrying', 'failed_permanent')),
  retry_count int not null default 0 check (retry_count >= 0),
  max_retries int not null default 3 check (max_retries >= 1),
  next_attempt_at timestamptz,
  latency_ms int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create index if not exists webhook_events_status_idx on public.webhook_events (status, created_at desc);
create index if not exists webhook_events_channel_idx on public.webhook_events (channel, created_at desc);
create index if not exists webhook_events_next_attempt_idx on public.webhook_events (next_attempt_at) where next_attempt_at is not null;
create index if not exists webhook_events_external_id_idx on public.webhook_events (external_id);
create index if not exists webhook_events_org_created_idx on public.webhook_events (organization_id, created_at desc);
create index if not exists dead_letter_events_org_created_idx on public.dead_letter_events (organization_id, created_at desc);
create index if not exists dead_letter_events_requeued_idx on public.dead_letter_events (requeued_at) where requeued_at is not null;

alter table public.webhook_events enable row level security;
alter table public.dead_letter_events enable row level security;

-- webhook_events
-- create policy webhook_events_org_scope on public.webhook_events
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = webhook_events.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- dead_letter_events
-- create policy dead_letter_events_org_scope on public.dead_letter_events
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = dead_letter_events.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- =====================================================
-- ONBOARDING + CUSTOMER HEALTH + RETENTION OPS (Sprint 13 scaffold)
-- =====================================================
create table if not exists public.onboarding_states (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  completed_task_keys text[] not null default '{}',
  progress_percent int not null default 0 check (progress_percent between 0 and 100),
  completed_at timestamptz,
  updated_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create table if not exists public.customer_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tenant_account_id text not null,
  tenant_account_name text not null,
  segment text,
  adoption_score int not null default 0 check (adoption_score between 0 and 100),
  activity_score int not null default 0 check (activity_score between 0 and 100),
  conversion_trend numeric(6,2) not null default 0,
  risk_level text not null check (risk_level in ('green', 'yellow', 'red')),
  reasons jsonb not null default '[]'::jsonb,
  suggested_actions jsonb not null default '[]'::jsonb,
  mrr_usd numeric(12,2) not null default 0,
  snapshot_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.health_actions_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tenant_account_id text not null,
  action_label text not null,
  owner_label text not null,
  note text,
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'done', 'dismissed')),
  created_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists onboarding_states_org_updated_idx on public.onboarding_states (organization_id, updated_at desc);
create index if not exists customer_health_snapshots_org_snapshot_idx on public.customer_health_snapshots (organization_id, snapshot_at desc);
create index if not exists customer_health_snapshots_org_risk_idx on public.customer_health_snapshots (organization_id, risk_level, snapshot_at desc);
create index if not exists health_actions_log_org_created_idx on public.health_actions_log (organization_id, created_at desc);
create index if not exists health_actions_log_org_status_idx on public.health_actions_log (organization_id, status, updated_at desc);

alter table public.onboarding_states enable row level security;
alter table public.customer_health_snapshots enable row level security;
alter table public.health_actions_log enable row level security;

-- onboarding_states
-- create policy onboarding_states_org_scope on public.onboarding_states
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = onboarding_states.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- customer_health_snapshots
-- create policy customer_health_snapshots_org_scope on public.customer_health_snapshots
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = customer_health_snapshots.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- health_actions_log
-- create policy health_actions_log_org_scope on public.health_actions_log
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = health_actions_log.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- =====================================================
-- PIPELINE RISK AUTOMATION + ALERTING (Sprint 14 scaffold)
-- =====================================================
create table if not exists public.risk_alert_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  title text not null,
  detail text not null,
  source text not null default 'risk_scan' check (source in ('risk_scan', 'manual')),
  created_at timestamptz not null default now()
);

create table if not exists public.risk_workflow_states (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_key text not null,
  name text not null,
  enabled boolean not null default true,
  threshold_days int not null default 3 check (threshold_days >= 1),
  action_label text not null,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, workflow_key)
);

create index if not exists risk_alert_events_org_created_idx on public.risk_alert_events (organization_id, created_at desc);
create index if not exists risk_alert_events_org_severity_idx on public.risk_alert_events (organization_id, severity, created_at desc);
create index if not exists risk_workflow_states_org_enabled_idx on public.risk_workflow_states (organization_id, enabled, updated_at desc);

alter table public.risk_alert_events enable row level security;
alter table public.risk_workflow_states enable row level security;

-- risk_alert_events
-- create policy risk_alert_events_org_scope on public.risk_alert_events
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = risk_alert_events.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- risk_workflow_states
-- create policy risk_workflow_states_org_scope on public.risk_workflow_states
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = risk_workflow_states.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- =====================================================
-- REVENUE BRIDGE (Sprint 15 scaffold)
-- =====================================================
create table if not exists public.integration_event_log (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('calendly', 'stripe')),
  external_event_id text not null,
  status text not null check (status in ('processed', 'ignored', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  error text,
  unique (provider, external_event_id)
);

create table if not exists public.bridge_transitions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  from_stage text not null,
  to_stage text not null,
  source_provider text not null check (source_provider in ('calendly', 'stripe')),
  external_event_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists integration_event_log_provider_processed_idx on public.integration_event_log (provider, processed_at desc);
create index if not exists integration_event_log_status_processed_idx on public.integration_event_log (status, processed_at desc);
create index if not exists bridge_transitions_deal_created_idx on public.bridge_transitions (deal_id, created_at desc);
create index if not exists bridge_transitions_provider_created_idx on public.bridge_transitions (source_provider, created_at desc);

alter table public.integration_event_log enable row level security;
alter table public.bridge_transitions enable row level security;

-- integration_event_log
-- create policy integration_event_log_org_scope on public.integration_event_log
--   for all using (auth.role() = 'service_role');

-- bridge_transitions
-- create policy bridge_transitions_org_scope on public.bridge_transitions
--   for all using (
--     exists (
--       select 1 from public.deals d
--       join public.memberships m on m.organization_id = d.organization_id
--       where d.id = bridge_transitions.deal_id
--       and m.user_id = auth.uid()
--     )
--   );
