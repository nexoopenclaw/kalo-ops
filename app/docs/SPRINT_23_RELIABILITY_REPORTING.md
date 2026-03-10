# Sprint 23 · Reliability + Reporting Upgrade

## Objetivo
Cerrar gaps de producción para dejar Kalo Ops más **go-live ready** sin nuevas keys.

## Entregado

### 1) Worker reliability v2
- Worker jobs persistidos en `in-memory-persistence` (`workerJobs`).
- Lease/lock semantics en `worker-service`:
  - `leaseOwner`, `lockedAt`, `leaseExpiresAt`.
  - bookkeeping de retry: `retryCount`, `lastAttemptAt`, `nextAttemptAt`, `lastError`.
- Endpoints:
  - `GET /api/worker/jobs?status=pending|running|failed|completed`
  - `POST /api/worker/jobs/[id]/requeue`

### 2) Outbound safeguards
- Idempotency keys en:
  - `POST /api/delivery/send-test` (`idempotencyKey` opcional)
  - `POST /api/channels/send` (`idempotencyKey` opcional)
- Guardrails:
  - Feature flag existente `outbound_sends_live`
  - Nuevo dry-run global por org (`outbound-safeguards` + `orgSafeguards`).
- Endpoint de control:
  - `GET/POST /api/ops/safeguards`

### 3) Revenue/attribution reporting upgrade
- Nuevo servicio `reporting-service`.
- Endpoints:
  - `GET /api/reports/commercial-performance?organizationId=org_1&from=&to=`
    - booked / won / bookingRate / closeRate / aging.
  - `GET /api/reports/attribution-performance?organizationId=org_1&from=&to=`
    - top contenido por leads/won/value + fallback mapping coverage.

### 4) UX Ops
- `/ops`:
  - módulo “Safeguards outbound” con estado dry-run global.
  - módulo “Worker reliability v2” con jobs recientes y retries.
- `/reportes`:
  - tarjetas de performance comercial consolidado.
  - tarjetas de attribution performance con fallback.
- Copy en español.

### 5) QA/build
- Actualizada la página `/qa` a Sprint 23.
- `npm run build` validado en local.

## Notas
- Persistencia sigue en memoria compartida del runtime (sin migración DB en este sprint).
- Idempotency usa hash del request + scope + key por organización.
