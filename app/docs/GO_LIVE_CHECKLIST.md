# Go-Live Checklist (Kalo Ops App)

Objetivo: poder desplegar y validar que la app está **keys-ready**, webhooks funcionando y health checks verdes.

## 1) Variables de entorno requeridas

> Nota: nunca pegues valores de claves en issues/Slack. Este doc solo lista *nombres*.

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Meta (IG/WA webhooks)
- `META_APP_SECRET`

### Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Calendly
- `CALENDLY_WEBHOOK_SIGNING_KEY`

## 2) Endpoints de health

- `GET /api/health` → alive
- `GET /api/health/config` → **503 si faltan keys** (no expone valores, solo booleanos)
- `GET /api/health/go-live` → agrega chequeo de Supabase (tabla `organizations`) + config.

### Deploy smoke test (recomendado)

```bash
npm run smoke:go-live
# machine-readable for CI logs
npm run smoke:go-live -- --json
```

Notas:
- Requiere env vars reales (ver `.env.example`).
- Falla con exit code 1 si algo crítico no está ok.

Opcional (recomendado en prod): proteger `GET /api/health/config` con header.
- Setear `HEALTH_ENDPOINT_TOKEN`
- Llamar con: `x-health-token: <token>`

Validación esperada para go-live:
- `/api/health/config` devuelve `ok: true`.

## 3) Webhooks (smoke test)

### Stripe
- Endpoint: `POST /api/webhooks/stripe`
- Validar: evento `checkout.session.completed` o equivalente llega y se procesa.

### Calendly
- Endpoint: `POST /api/webhooks/calendly`
- Validar: booking event llega y se procesa.

### Meta
- Endpoint: `POST /api/webhooks/meta`
- Validar: firma y enrutado de tenant.

## 4) Worker cron (reliability / retries / digests)

La app tiene un worker “light” que procesa:
- retries de webhooks (retry queue)
- automations
- digests

### Endpoint (cron)
- `POST /api/cron/worker-tick` (opcional `?orgId=<id>`)
- Requiere:
  - env `CRON_JOB_TOKEN`
  - header `x-cron-token: <CRON_JOB_TOKEN>`

Recomendación: configurar un cron externo (Vercel Cron / GitHub Actions / cualquier scheduler) para llamar este endpoint cada 1-5 min.

Validación rápida:
```bash
curl -X POST "$APP_URL/api/cron/worker-tick" \
  -H "x-cron-token: $CRON_JOB_TOKEN"
```

## 5) Post-deploy
- Confirmar que la app compila (`npm run build`).
- Confirmar que los endpoints de health están accesibles.
- Revisar logs de webhooks (Stripe/Calendly/Meta) por 10-15 min y verificar que no hay `INVALID_SIGNATURE` / `NOT_CONFIGURED`.
- Si usás cron: verificar que `POST /api/cron/worker-tick` está corriendo y no devuelve 5xx.
