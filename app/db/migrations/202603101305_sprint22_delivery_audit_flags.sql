-- Sprint 22 · delivery orchestrator + automation audit + attribution mappings + feature flags

create table if not exists public.delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel text not null check (channel in ('email','whatsapp','slack')),
  recipient text not null,
  message text not null,
  provider text not null,
  mode text not null check (mode in ('mock','live')),
  status text not null check (status in ('queued','sent','retrying','failed')),
  attempt int not null default 1,
  max_attempts int not null default 3,
  retry_at timestamptz,
  correlation_id uuid not null,
  external_message_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists delivery_attempts_org_created_idx on public.delivery_attempts (organization_id, created_at desc);

create table if not exists public.automation_execution_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  automation_id uuid references public.automations(id) on delete set null,
  workflow_name text not null,
  correlation_id uuid not null,
  trigger_type text not null,
  status text not null check (status in ('success','failed','skipped')),
  inputs jsonb not null default '{}'::jsonb,
  decisions jsonb not null default '{}'::jsonb,
  outputs jsonb not null default '{}'::jsonb,
  duration_ms int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists automation_execution_audit_org_created_idx on public.automation_execution_audit (organization_id, created_at desc);

create table if not exists public.attribution_fallback_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  match_pattern text not null,
  content_piece_id text not null,
  priority int not null default 50,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists attribution_fallback_mappings_org_priority_idx on public.attribution_fallback_mappings (organization_id, priority desc, updated_at desc);

create table if not exists public.feature_flags_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  flag_key text not null,
  override_value boolean not null,
  updated_by_user_id uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (organization_id, flag_key)
);
