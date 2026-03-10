# Sprint 22 · Delivery, Attribution, Flags (keys-ready)

## Scope closed

1. **Delivery orchestrator (provider-agnostic)**
   - New service: `src/lib/delivery-orchestrator.ts`
   - Routes:
     - `POST /api/delivery/send-test`
     - `GET /api/delivery/history`
   - Supports `email | whatsapp | slack` in `mock/live` and writes attempt history with status transitions (`queued/sent/retrying/failed`), retry window (`retryAt`) and correlation id.

2. **Automation persistence + execution audit**
   - New service: `src/lib/automation-audit-service.ts`
   - Executor now writes structured audit entry per run (`inputs`, `decisions`, `outputs`, `durationMs`, `correlationId`).
   - New endpoint: `GET /api/automations/audit`
   - `/automations` UI includes **Audit trail** panel with latest runs.

3. **Revenue attribution linkage uplift**
   - `attribution-service` strengthened with deterministic scoring + fallback mapping when confidence is low.
   - New fallback mapping model in persistence state.
   - New endpoint: `GET/POST /api/attribution/mappings`

4. **Go-live safety controls**
   - New flag registry: `src/lib/feature-flags.ts` (env + db/in-memory override).
   - Risky modules now flag-gated:
     - `/api/webhooks/process` → `webhooks_live_processing`
     - `/api/channels/send` → `outbound_sends_live`
     - `/api/automations/execute` tagged with `automations_live_execute` mode in context/audit
   - `/ops` now surfaces live/mock flag state and source.

## Env flags

- `KALO_FLAG_WEBHOOKS_LIVE_PROCESSING`
- `KALO_FLAG_OUTBOUND_SENDS_LIVE`
- `KALO_FLAG_AUTOMATIONS_LIVE_EXECUTE`

Accepted truthy values: `1`, `true`, `yes`, `on`, `live`.

## Notes

- Implementation is **keys-ready** and defaults to safe/mock unless explicitly enabled by env or override.
- Delivery + audit stores are currently in-memory runtime stores aligned with existing app persistence strategy.
