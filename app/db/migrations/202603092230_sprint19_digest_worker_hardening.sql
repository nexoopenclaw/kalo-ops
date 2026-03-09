-- Sprint 19 · Digest + Worker no-keys hardening

create table if not exists public.digest_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  digest_type text not null check (digest_type in ('daily', 'weekly')),
  status text not null default 'completed' check (status in ('completed', 'failed')),
  summary text not null,
  body text not null,
  delivery_status text not null default 'queued' check (delivery_status in ('queued', 'sent', 'failed', 'not_sent')),
  generated_by_user_id uuid references auth.users(id),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.worker_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_type text not null check (job_type in ('automation', 'webhook_retry', 'digest')),
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  attempts int not null default 0 check (attempts >= 0),
  max_attempts int not null default 3 check (max_attempts >= 1),
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists digest_runs_org_type_generated_idx on public.digest_runs (organization_id, digest_type, generated_at desc);
create index if not exists worker_jobs_org_status_updated_idx on public.worker_jobs (organization_id, status, updated_at desc);

alter table public.digest_runs enable row level security;
alter table public.worker_jobs enable row level security;

-- RLS stubs
-- create policy digest_runs_org_scope on public.digest_runs
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = digest_runs.organization_id
--       and m.user_id = auth.uid()
--     )
--   );

-- create policy worker_jobs_org_scope on public.worker_jobs
--   for all using (
--     exists (
--       select 1 from public.memberships m
--       where m.organization_id = worker_jobs.organization_id
--       and m.user_id = auth.uid()
--     )
--   );
