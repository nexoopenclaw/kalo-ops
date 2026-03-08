# Sprint 15 · Revenue Bridge (Calendly + Stripe)

## Objetivo
Cerrar dos gaps críticos del PRD con scaffold productivo (sin credenciales obligatorias en local):

1. **Calendly booking → Deal stage `booked`**
2. **Stripe payment → Deal stage `won`**

---

## Alcance implementado

- Servicio nuevo: `src/lib/revenue-bridge-service.ts`
  - `processCalendlyBooking(event)`
  - `processStripePayment(event)`
  - `mapToDealTransition(...)`
  - Idempotencia por `(provider, externalEventId)`.
  - Reusa `crmService.updateDealStage` y `crmService.upsertDealNote` para historial y notas.

- Webhooks nuevos:
  - `POST /api/webhooks/calendly`
  - `POST /api/webhooks/stripe`
  - Parser seguro (`try/catch` + tipos mínimos)
  - Placeholder de firma
  - Modo `NOT_CONFIGURED` con fallback mock header `x-kalo-mock-signature: dev-ok`

- Visibilidad operativa:
  - Panel **Revenue Bridge** en `/hoy`
  - Muestra:
    - últimos eventos Calendly
    - últimos eventos Stripe
    - transiciones aplicadas
    - contadores fallidos / ignorados

- Esquema SQL (`db/schema.sql`):
  - `public.integration_event_log`
  - `public.bridge_transitions`
  - Índices + stubs RLS

---

## Criterios de aceptación

- [x] Booking de Calendly válido mueve deal a `booked` (si aplica).
- [x] Pago Stripe válido mueve deal a `won` (si aplica).
- [x] Cada webhook escribe evento idempotente (mismo external id no reprocesa).
- [x] Se agrega nota en deal con contexto `[Revenue Bridge]`.
- [x] Panel `/hoy` refleja actividad del bridge.
- [x] Si no hay secretos webhook, API responde `NOT_CONFIGURED` salvo mock explícito.

---

## Payloads de ejemplo

### Calendly (mock)
`POST /api/webhooks/calendly`

Headers:
- `Content-Type: application/json`
- `x-kalo-mock-signature: dev-ok`

```json
{
  "event": "invitee.created",
  "created_at": "2026-03-08T18:00:00.000Z",
  "payload": {
    "event": {
      "uri": "https://api.calendly.com/scheduled_events/AAA",
      "start_time": "2026-03-09T10:00:00.000Z"
    },
    "invitee": {
      "uri": "https://api.calendly.com/scheduled_events/AAA/invitees/BBB",
      "email": "martina@atenea.io",
      "name": "Martina Varela"
    },
    "questions_and_answers": [
      { "question": "deal_id", "answer": "deal_1" }
    ]
  }
}
```

### Stripe (mock)
`POST /api/webhooks/stripe`

Headers:
- `Content-Type: application/json`
- `x-kalo-mock-signature: dev-ok`

```json
{
  "id": "evt_test_001",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_001",
      "customer_email": "martina@atenea.io",
      "amount_received": 480000,
      "currency": "eur",
      "metadata": {
        "deal_id": "deal_1"
      }
    }
  }
}
```

---

## Notas para pasar a producción

1. Reemplazar verificación placeholder por verificación oficial SDK de Stripe/Calendly.
2. Persistir logs/transition en Supabase (tablas nuevas ya definidas).
3. Enrutar `organizationId` real por tenant en lugar de `org_1` fijo.
4. Agregar alertas Slack para `failed` y volumen anómalo de `ignored`.
