-- Sprint 12 reliability: persist normalized payload + processing log for observability

alter table public.webhook_events
  add column if not exists normalized_payload jsonb not null default '{}'::jsonb,
  add column if not exists processing_log jsonb not null default '[]'::jsonb;

-- Backfill existing rows (in case default didn't apply)
update public.webhook_events
set normalized_payload = coalesce(normalized_payload, '{}'::jsonb),
    processing_log = coalesce(processing_log, '[]'::jsonb)
where normalized_payload is null or processing_log is null;

-- Multi-tenant idempotency: prefer (org_id, idempotency_key) uniqueness.
-- If a legacy global unique constraint exists, drop its index safely.
drop index if exists public.webhook_events_idempotency_key_key;
create unique index if not exists webhook_events_org_idempotency_unique
  on public.webhook_events (organization_id, idempotency_key);
