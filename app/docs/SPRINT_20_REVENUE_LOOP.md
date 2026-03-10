# Sprint 20 · Revenue Loop Hardening (sin nuevas keys)

## Objetivo
Blindar el puente Stripe + Calendly, habilitar simulación E2E interna y elevar observabilidad + checks de consistencia antes de producción.

## Entregado

### 1) Bridge hardening (Stripe + Calendly)
- Validadores estrictos en `src/lib/revenue-bridge-validation.ts`:
  - `validateCalendlyWebhook(payload)`
  - `validateStripeWebhook(payload)`
- Taxonomía de dead-letter reasons:
  - `INVALID_PAYLOAD`
  - `DEAL_NOT_FOUND`
  - `IDEMPOTENCY_CONFLICT`
  - `TRANSITION_BLOCKED`
  - `CRM_UPDATE_FAILED`
  - `INTERNAL_ERROR`
- Idempotencia determinista:
  - `computeRevenueIdempotencyKey(provider, org, externalEventId)`
  - Manejo de conflicto explícito cuando entra mismo ID con payload diferente.
- Guards de transición:
  - No regresión de etapas.
  - Estados terminales (`won`, `lost`) no retroceden.

### 2) End-to-end simulator
- Nueva pantalla interna: `GET /simulator`
- Nuevo endpoint orquestador:
  - `POST /api/simulator/revenue-loop/run`
- Flujo simulado:
  - booking Calendly → transición a `booked`
  - pago Stripe → transición a `won`
- Devuelve:
  - estado final del deal
  - stage history reciente
  - snapshot de logs del bridge

### 3) Observability pack
- Correlation ID propagado desde request (`x-request-id` o generado) hacia:
  - webhook handlers
  - revenue bridge service
  - logs estructurados
- Endpoint snapshot de operaciones:
  - `GET /api/ops/diagnostics`
  - incluye worker status, queue backlogs, bridge processing stats, latest failures by category.
- Panel ligero en `/ops`:
  - bloque "Panel diagnóstico"
  - visibilidad rápida de fallos por categoría + integrity summary.

### 4) Data consistency checks
- Servicio nuevo: `src/lib/integrity-check-service.ts`
  - chequea linkage lead/conversation/deal.
  - detecta duplicados por email en deals.
  - devuelve suggested fixes accionables.
- Endpoint:
  - `GET /api/ops/integrity-check`

### 5) QA y documentación
- QA actualizado en `/qa` con casos para:
  - simulator
  - diagnostics
  - integrity-check
  - conflictos de idempotencia
- Documento actual de sprint:
  - `docs/SPRINT_20_REVENUE_LOOP.md`

## Acceptance checklist
- [x] Payload validation estricta en webhooks Stripe + Calendly.
- [x] Idempotencia determinista + conflicto detectado.
- [x] Guard rails de transición (sin regresión).
- [x] Dead-letter taxonomy activa y visible en diagnóstico.
- [x] Ruta `/simulator` funcional con copy en español.
- [x] API `/api/simulator/revenue-loop/run` funcional.
- [x] API `/api/ops/diagnostics` funcional.
- [x] API `/api/ops/integrity-check` funcional.
- [x] Panel de diagnóstico en `/ops` actualizado.
- [x] UI premium dark con acento `#d4e83a`.
