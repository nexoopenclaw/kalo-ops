# PRD Coverage Status (Light Audit)

Source audited: sprint PRDs in `docs/SPRINT_*` vs local code in `app/` only (full PRD master file pending).

| Area | Status | Evidence | Next |
|---|---|---|---|
| Foundation: Next.js + Supabase scaffold | Partial | `package.json`, `src/lib/supabase/*`, `db/schema.sql` | Wire prod Supabase env + run migrations in shared envs.
| Go-live: keys-ready + health config checks | Partial | `GET /api/health/config`, `docs/GO_LIVE_CHECKLIST.md` | Add deploy-specific smoke tests + optionally protect the config endpoint.
| RF-001 Auth + org roles | Partial | `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`, tables `organizations/profiles/memberships` | Enforce role guards in UI/API and complete invite flow.
| Multi-tenant + data model breadth | Partial | `db/schema.sql` includes org-scoped tables across inbox/CRM/automation/reporting | Replace remaining mock-state reads with DB-backed queries.
| Security (RLS/policies) | Partial | `db/schema.sql` enables RLS on many tables but most policies are commented stubs | Implement + test RLS policies per table before prod.
| Unified Inbox UI | Partial | `src/app/(app)/inbox/page.tsx`, `src/components/inbox/inbox-workspace.tsx` | Connect to realtime persisted conversations/messages.
| Inbox messaging API | Partial | `src/app/api/messages/send/route.ts`, `src/app/api/leads/*` | Add attachments/media + error handling per provider.
| Channel adapters (IG/WA/Email) | Partial | `src/lib/channel-adapters/*` | Replace TODO/mock adapters with provider SDK flows.
| Meta webhook ingestion | Partial | `src/app/api/webhooks/meta/route.ts`, `src/lib/webhook-engine.ts` | Map real tenant IDs + strengthen signature/idempotency checks.
| CRM + pipeline core | Partial | `src/app/(app)/crm/page.tsx`, `src/lib/crm-service.ts`, `/api/deals/*` | Add Kanban DnD persistence and stage transition rules.
| Deal history + objections model | Partial | `db/schema.sql` tables `deal_stage_history`, `deal_objections` | Expose full UI + reporting filters from these tables.
| Calendly booking integration (MVP req) | Partial | `src/app/api/webhooks/calendly/route.ts` (signature + adapter dispatch) | Map booking → org/deal and auto-stage to `booked`.
| Stripe payment close-won (MVP req) | Partial | `src/app/api/webhooks/stripe/route.ts` (verification + adapter dispatch) | Map checkout/customer → deal and update revenue safely.
| Automation engine | Partial | `src/app/(app)/automations/page.tsx`, `/api/automations/*`, tables `automations/automation_logs` | Add background executor + persisted run logs.
| AI Copilot | Partial | `src/app/(app)/copilot/page.tsx`, `/api/copilot/*`, table `ai_interactions` | Integrate real LLM provider + latency/feedback telemetry.
| Voice notes + compliance | Partial | `src/app/(app)/voice-lab/page.tsx`, `/api/voice/*`, tables `voice_consents/voice_notes_audit` | Connect real TTS provider + immutable audit storage.
| A/B testing | Partial | `/api/experiments/*`, tables `experiments/experiment_events` | Add statistical significance and winner promotion flow.
| Content attribution | Partial | `src/app/(app)/attribution/page.tsx`, `/api/attribution/*`, tables `content_*` | Implement real IG post/story linkage to inbound DMs.
| Reporting + alerts | Partial | `src/app/(app)/reportes/page.tsx`, `/api/reports/*`, table `reports_snapshots/alert_configs` | Schedule delivery (email/slack/wa) + exports PDF/CSV.
| Webhook reliability | Partial | `src/app/(app)/webhooks/page.tsx`, `/api/webhooks/*`, tables `webhook_events/dead_letter_events` | Add queue worker/cron retry loop + SLO dashboards.
| Onboarding + health | Partial | `src/app/(app)/onboarding`, `src/app/(app)/health`, `/api/onboarding/*`, `/api/health/*` | Persist all actions to Supabase; remove in-memory fallback.
| Pipeline risk automation (Sprint 14) | Partial | `src/app/(app)/hoy/page.tsx`, `/api/risk/*`, `src/lib/risk-automation-service.ts`, risk tables in schema | Run scheduled scans and persist event lifecycle.
| Daily MVP acceptance readiness | Partial | Major blocks present; critical gaps remain (Calendly/Stripe/realtime prod adapters) | Close MVP blockers first, then harden reliability + compliance.

Legend: **Done** = production-complete in local code, **Partial** = scaffold/prototype exists, **Missing** = no concrete implementation found.
