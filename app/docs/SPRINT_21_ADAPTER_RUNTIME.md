# Sprint 21 · Adapter Runtime + Replay + Attribution Explain

## Objetivo
Unificar runtime de proveedores (mock/live), endurecer replay/backoff y hacer explicable el matching DM→contenido.

## Entregado
- `src/lib/provider-runtime.ts`
  - Contratos runtime para `meta`, `whatsapp`, `email`, `stripe`, `calendly`.
  - Modo por adapter (`mock/live`) con override opcional por env `KALO_ADAPTER_MODE_*`.
  - Matriz de capacidades + health + `lastError`.
  - Revenue webhooks (Stripe/Calendly) procesados vía adapter runtime.
  - Meta webhook procesado vía adapter runtime.
- `src/lib/webhook-replay-service.ts`
  - Replay single y batch con salida determinista.
  - Config de backoff exponencial + jitter determinista:
    - `KALO_BACKOFF_BASE_MS`
    - `KALO_BACKOFF_MAX_MS`
    - `KALO_BACKOFF_JITTER_PERCENT`
- Endpoints:
  - `POST /api/webhooks/replay`
  - `POST /api/webhooks/replay/batch`
  - `GET /api/attribution/explain/[leadId]`
- UI:
  - `/integraciones`: modo mock/live, health, capacidades, último error.
  - `/ops`: visibilidad de backoff + estado adapters + control replay dry-run.
- QA:
  - Checklist Sprint 21 en `/qa`.

## Acceptance checklist
- [ ] Los flujos de webhook principales usan interfaces runtime (meta/stripe/calendly).
- [ ] El envío de inbox usa adapter runtime para instagram/whatsapp/email.
- [ ] Replay single y batch responden con estructura determinista en dry-run.
- [ ] Configuración de backoff es visible en `/ops`.
- [ ] Endpoint explain devuelve score y razones deterministicamente para un `leadId`.
- [ ] UI mantiene estilo dark premium y acento `#d4e83a`.
- [ ] `npm run build` pasa en local/CI.
