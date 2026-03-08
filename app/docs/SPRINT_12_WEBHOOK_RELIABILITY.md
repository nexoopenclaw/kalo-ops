# Sprint 12 · Webhook-first Reliability + Operational Readiness

## Objetivo
Elevar confiabilidad operacional del pipeline inbound con un centro de inspección webhook, engine resiliente y endpoints internos para retry/requeue.

## Alcance implementado

### 1) Webhook Processing Center
- Nueva página interna: `/webhooks`
- Timeline de eventos inbound con columnas operativas: canal, estado, retries, latencia, organización.
- Filtros:
  - canal
  - estado
  - rango de fechas
  - búsqueda por `external_id`
- Drawer/Panel de detalle por evento con:
  - payload normalizado
  - processing log cronológico

### 2) Engine resiliente (`src/lib/webhook-engine.ts`)
- Normalización inbound por canal vía dispatcher existente (`channelDispatcher.normalizeInbound`)
- Idempotency guard:
  - generación de `idempotencyKey` SHA-256
  - detección de duplicados
- Retry policy metadata:
  - `retryCount`
  - `maxRetries`
  - `nextAttemptAt` con backoff exponencial
- Dead-letter routing:
  - estado `failed_permanent`
  - persistencia en cola `deadLetterEvents`

### 3) API routes internas
- `POST /api/webhooks/process`
  - procesa payload normalizado
  - valida channel/payload/maxRetries
- `GET /api/webhooks/events`
  - lista timeline con filtros
  - retorna métricas agregadas
- `POST /api/webhooks/retry/:id`
  - incrementa retry y recalcula estado
- `POST /api/webhooks/dead-letter/:id/requeue`
  - reencola evento dead-letter

> Todas responden con formato consistente `ok/fail` mediante `src/lib/api-response.ts`.

### 4) Extensión de esquema SQL (`db/schema.sql`)
- Tabla `public.webhook_events`
- Tabla `public.dead_letter_events`
- Índices:
  - status
  - channel
  - next_attempt_at
  - external_id
- RLS habilitado + stubs de políticas por `organization_id`

### 5) Calidad operativa
- Cards métricas en `/webhooks`:
  - success rate
  - latencia promedio
  - tamaño cola retry
  - conteo dead-letter
- QA actualizado en `/qa` con checks de confiabilidad webhook.

## Matriz de pruebas (manual)

| Caso | Input | Resultado esperado |
|---|---|---|
| Process válido | `POST /api/webhooks/process` payload correcto | `202` + evento normalizado |
| Idempotencia | mismo payload/eventId dos veces | segunda respuesta con `idempotencyHit=true` |
| Retry manual | `POST /api/webhooks/retry/:id` | sube `retryCount`, set `nextAttemptAt` |
| Dead-letter requeue | `POST /api/webhooks/dead-letter/:id/requeue` | evento pasa a `retrying` |
| Filtros timeline | query channel/status/date/search | lista filtrada coherente |
| Validación robusta | body/query inválidos | `ok:false` + `VALIDATION_ERROR` |

## Plan de rollout recomendado
1. Deploy en Preview (Vercel) + smoke test de endpoints.
2. Verificar dashboard `/webhooks` con datos seed y eventos de prueba.
3. Activar captura real de webhooks por canal (feature flag por adapter).
4. Conectar persistencia Supabase para reemplazar in-memory state.
5. Habilitar alertas operativas (retry queue threshold y dead-letter spikes).
