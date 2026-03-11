# Kalo Ops — PRD v1 (Master)

> Este documento consolida el PRD en un **único lugar**.
> Fuente: `docs/SPRINT_*` (PRDs incrementales) + checklist de go-live.

## 0) Objetivo
Construir una app multi-tenant (org-based) para operar:
- **Unified Inbox** (canales: Meta/IG/WA + email a futuro)
- **CRM + pipeline** (stages, history, objections)
- **Automations** (triggers → actions)
- **Reporting** (commercial + attribution)
- **Reliability** (webhook idempotency, retries, worker tick)

## 1) Usuarios y Jobs-to-be-done
- SDR/Closer: ver inbox, convertir lead, mover deal, cobrar, medir.
- Ops/Founder: health, safeguards, reliability, ver reportes.

## 2) Alcance MVP (keys-ready)
### Must-have
- Auth + organizaciones + RBAC mínimo.
- Webhooks: **Meta**, **Stripe**, **Calendly** (verificación de firma + routing org).
- Inbox/CRM UI con datos persistidos (Supabase).
- Worker tick para retries/digests (cron externo).
- Health endpoints + smoke tests (go-live).

### Nice-to-have
- Realtime en inbox.
- Export CSV/PDF reportes.

## 3) Requisitos funcionales (por sprints)
Este PRD se implementa por incrementos. Cada sprint es la especificación detallada:

- Setup / Base: `SPRINT_2_SETUP.md`
- Analytics: `SPRINT_4_ANALYTICS.md`
- Automations: `SPRINT_5_AUTOMATIONS.md`
- Copilot: `SPRINT_6_COPILOT.md`
- Acceptance/QA: `SPRINT_8_ACCEPTANCE.md`
- Voice + A/B: `SPRINT_8_VOICE_ABTEST.md`
- Attribution + reporting: `SPRINT_10_ATTRIBUTION_REPORTING.md`
- Multichannel: `SPRINT_11_MULTICHANNEL.md`
- Webhook reliability: `SPRINT_12_WEBHOOK_RELIABILITY.md`
- Onboarding + health: `SPRINT_13_ONBOARDING_HEALTH.md`
- Hoy cockpit: `SPRINT_14_HOY_COCKPIT.md`
- Pipeline risk automation: `SPRINT_14_PIPELINE_RISK_AUTOMATION.md`
- Revenue bridge: `SPRINT_15_REVENUE_BRIDGE.md`
- Automation executor: `SPRINT_16_AUTOMATION_EXECUTOR.md`
- Supabase backend: `SPRINT_17_SUPABASE_BACKEND.md`
- RBAC + realtime: `SPRINT_18_RBAC_REALTIME.md`
- No-keys hardening: `SPRINT_19_NO_KEYS_HARDENING.md`
- Revenue loop: `SPRINT_20_REVENUE_LOOP.md`
- Adapter runtime: `SPRINT_21_ADAPTER_RUNTIME.md`
- Delivery + attribution flags: `SPRINT_22_DELIVERY_ATTRIBUTION_FLAGS.md`
- Reliability + reporting upgrade: `SPRINT_23_RELIABILITY_REPORTING.md`

## 4) Go-live
Checklist operativa:
- `GO_LIVE_KEYS_CHECKLIST.md`
- `GO_LIVE_CHECKLIST.md`

Smoke tests (recomendado para CI/Deploy):
- `npm run smoke:go-live` (health + config + Supabase)
- `npm run smoke:cron-worker` (endpoint cron protegido)

## 5) Integraciones (keys-ready)
- Meta: webhook + signature + tenant routing + event ingestion.
- Stripe: webhook + mapping deal/customer + revenue update.
- Calendly: webhook + mapping booking → deal + stage update.

## 6) Observabilidad / Reliability (mínimo para prod)
- Health endpoints:
  - `GET /api/health`
  - `GET /api/health/config` (503 si faltan keys, sin exponer valores)
  - `GET /api/health/go-live` (config + Supabase)
- Worker tick (cron): `POST /api/cron/worker-tick`
- Webhooks: idempotency + dead-letter/retry.

## 7) Estado actual y gaps
Ver auditoría liviana de coverage vs código:
- `PRD_COVERAGE_STATUS.md`

## 8) Definición de “Done” para PRD v1
- Existe un **master PRD** (este doc) + todos los sprints referenciados.
- Cada feature crítica del MVP tiene:
  - endpoint/UI
  - modelo/persistencia
  - checklist de QA
  - smoke test go-live

