# Sprint 19 · No-Keys Hardening

## Objetivo
Maximizar progreso de PRD sin nuevas credenciales: digest operativo, worker interno, hardening API y diagnóstico en Ops.

## Entregado

### 1) Digest engine (daily/weekly)
- Servicio nuevo: `src/lib/digest-service.ts`
- Composición real con módulos existentes: hoy, crm, inbox, risk, attribution.
- Templates en español, accionables y orientados a operación.
- Historial de runs in-memory + snapshot persistible (`reportSnapshots`) y tabla `digest_runs` en migración.
- Endpoints:
  - `GET /api/digest/daily/preview`
  - `GET /api/digest/weekly/preview`
  - `POST /api/digest/run` (`{ "type": "daily|weekly", "enqueue": boolean }`)
  - `GET /api/digest/runs`

### 2) Worker scaffold
- Servicio nuevo: `src/lib/worker-service.ts`
- Cola ligera in-runtime con retries básicos y estado por job.
- Integración con:
  - automation queue (`automationQueue.runNext`)
  - webhook retry queue (`retryWebhookEvent`)
  - digest queue (`digestService.run`)
- Endpoints:
  - `POST /api/worker/tick`
  - `GET /api/worker/status`

### 3) Hardening sin claves
- Rate limit helper: `src/lib/rate-limit.ts`
- Structured logger con request id y redacción segura: `src/lib/logger.ts`
- Aplicado en rutas críticas:
  - `/api/webhooks/meta`
  - `/api/webhooks/stripe`
  - `/api/automations/execute`
- Panel de diagnóstico en `/ops`:
  - worker queue depth
  - último digest run
  - backlog webhook retry

### 4) Schema
- Migración nueva:
  - `db/migrations/202603092230_sprint19_digest_worker_hardening.sql`
- Añade tablas:
  - `public.digest_runs`
  - `public.worker_jobs`
- Incluye índices y stubs RLS por organización.

## Notas
- Delivery de digest permanece provider-agnostic (status queued/not_sent), listo para conectar adapters reales.
- En entorno sin DB/keys, el flujo opera con estado en memoria y snapshots locales ya existentes.
