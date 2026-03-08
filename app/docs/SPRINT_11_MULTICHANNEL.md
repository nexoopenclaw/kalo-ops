# Sprint 11 · Foundation Multicanal + Madurez Operativa

## Objetivo
Construir una base production-minded, sin credenciales reales, para operar Inbox unificado y observabilidad de canales (Instagram, WhatsApp, Email).

## Arquitectura implementada

### 1) Inbox multicanal
- `/inbox` ahora opera con **cola unificada** y tabs por canal (`Todo`, `Instagram`, `WhatsApp`, `Email`).
- Filtros activos: estado, owner y “solo sin respuesta”.
- Cards de conversación incluyen:
  - badge de canal
  - owner
  - estado SLA
  - unread
  - etapa pipeline
- Panel de thread incluye:
  - badge de tipo de mensaje (`Texto`, `Voz`, `Imagen`, `Sistema`)
  - iconografía de canal fuente.

### 2) Channel adapters (scaffold)
Carpeta nueva: `src/lib/channel-adapters/`
- `types.ts`: contratos tipados para envío, inbound normalizado, health y acciones operativas.
- `instagram-adapter.ts`
- `whatsapp-adapter.ts`
- `email-adapter.ts`
- `dispatcher.ts`: abstracción central para `send`, `normalizeInbound`, `health`, `pause`, `resume`, `retryFailed`.
- `mock-state.ts`: estado en memoria para health/queue en modo credential-free.

### 3) API multicanal
- `POST /api/channels/send`
  - valida payload
  - enruta por dispatcher
  - devuelve esquema `{ ok, data }`
  - incluye TODO explícito para SDK/credenciales reales.
- `POST /api/channels/inbound`
  - recibe canal + payload crudo
  - responde envelope normalizado único.
- `GET /api/channels/health`
  - estado por adapter con latencia/cola/sync.
- Extra operativo mock:
  - `POST /api/channels/control` con acciones `pause | resume | retry_failed`.

### 4) Operaciones
- Nueva vista `/ops` con:
  - salud de adapters
  - queue depth, brechas SLA y backlog por canal (mock)
  - quick actions: pausar, reanudar, reintentar fallidos (mock).

### 5) Base de datos (schema)
Se extiende `db/schema.sql` con:
- `channel_events` (inbound/outbound normalizado, org-scoped)
- `outbound_messages` (estado de delivery, retries, provider ids)
- campos normalizados para `channel`, `message_type`, `status`, `retry_count`
- índices por organización + tiempos/estado
- RLS enable + policy stubs.

## Criterios de aceptación
- [x] Inbox muestra y filtra conversaciones por canal en cola unificada.
- [x] Conversaciones muestran badge de canal, owner, SLA, unread y etapa.
- [x] Thread muestra badges de tipo de mensaje e iconografía de canal.
- [x] Arquitectura de adapters tipada y separada por canal.
- [x] API send/inbound/health con validación y formato consistente.
- [x] Página Ops disponible con métricas mock y quick actions.
- [x] Schema SQL extendido con tablas/events outbound + RLS stubs.
- [x] QA actualizado para validar multicanal.

## Rollout checklist
1. Definir credenciales y secretos por proveedor en Vercel (`IG`, `WA`, `SMTP/API`).
2. Sustituir adapters mock por SDK real manteniendo interfaz `ChannelAdapter`.
3. Persistir `/api/channels/inbound` en `public.channel_events`.
4. Persistir `/api/channels/send` en `public.outbound_messages`.
5. Activar cron/worker para retry policy por `retry_count` y `next_retry_at`.
6. Conectar `/ops` a métricas reales (colas, SLA, fallos por proveedor).
7. Validar webhooks firmados (firma, replay protection, idempotencia).
8. Ejecutar smoke test end-to-end en preview y producción.
