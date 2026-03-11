# Go-Live Checklist (Kalo Ops App)

Objetivo: poder desplegar y validar que la app está **keys-ready**, webhooks funcionando y health checks verdes.

## 1) Variables de entorno requeridas

> Nota: nunca pegues valores de claves en issues/Slack. Este doc solo lista *nombres*.

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Cron (worker tick)
- `CRON_JOB_TOKEN`

### Guardrail (persistencia)
- `ALLOW_IN_MEMORY_PERSISTENCE` (default: false)
  - En runtime **production**, el endpoint `/api/health/go-live` falla si esto no está en `true`.
  - Objetivo: obligar a decidir explícitamente si aceptamos el riesgo de persistencia in-memory hasta migrar a Supabase.

### Meta (IG/WA webhooks)
- `META_APP_SECRET`

### Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Calendly
- `CALENDLY_WEBHOOK_SIGNING_KEY`

## 2) Endpoints de health

- `GET /api/health` → alive (incluye `runtime` para debug)
- `GET /api/health/config` → **503 si faltan keys** (no expone valores, solo booleanos)
- `GET /api/health/go-live` → agrega chequeo de Supabase (tabla `organizations`) + config.

Notas:
- Todos los endpoints de health responden con `cache-control: no-store` (evita caches/CDN engañosos en prod).

### Deploy smoke test (recomendado)

Local (corre checks directos con env vars locales):

```bash
npm run smoke:go-live
# machine-readable for CI logs
npm run smoke:go-live -- --json
```

Remote (pega al deployment y valida `/api/health`, `/api/health/config` y `/api/health/go-live`):

```bash
APP_URL=https://<tu-dominio> npm run smoke:go-live
# o
npm run smoke:go-live -- --url https://<tu-dominio>
```

Notas:
- Requiere env vars reales (ver `.env.example`).
- Si `HEALTH_ENDPOINT_TOKEN` está seteado en el deploy, el smoke manda `x-health-token` automáticamente.
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

### Cron smoke test (recomendado)

Remote (pega al deployment y valida que el endpoint protegido responde OK):

```bash
APP_URL=https://<tu-dominio> CRON_JOB_TOKEN=*** npm run smoke:cron-worker
# machine-readable for CI logs
npm run smoke:cron-worker -- --url https://<tu-dominio> --json
```

Notas:
- Requiere `CRON_JOB_TOKEN` local para poder llamar al endpoint.
- Opción: `--orgId <id>` para probar un tenant específico.
- Falla con exit code 1 si devuelve 4xx/5xx o si no puede conectar.

### Endpoint (cron)
- `POST /api/cron/worker-tick` (opcional `?orgId=<id>`)
- Opcional: `?iterations=<n>` para ejecutar varios ticks seguidos (default: 3, max: 20). Útil para drenar backlog sin subir frecuencia del cron.
- Requiere:
  - env `CRON_JOB_TOKEN`
  - header `x-cron-token: <CRON_JOB_TOKEN>`

Recomendación: configurar un cron externo (Vercel Cron / GitHub Actions / cualquier scheduler) para llamar este endpoint cada 1-5 min.

Validación rápida:
```bash
curl -X POST "$APP_URL/api/cron/worker-tick?iterations=10" \
  -H "x-cron-token: $CRON_JOB_TOKEN"
```

## 5) Reporting exports (CSV)
Endpoints listos para descargar CSV (útil para compartir con equipo/cliente):
- `GET /api/reports/commercial-performance/export?format=csv&organizationId=<org_id>`
- `GET /api/reports/attribution-performance/export?format=csv&organizationId=<org_id>`

Nota: `organizationId` es **requerido** (sin default) para evitar descargas accidentales del org equivocado.

Nota: actualmente exportan el subset disponible (mock/in-memory). Cuando reporting se conecte full a Supabase, estos exports quedan como interfaz estable.

## 6) Post-deploy
- Confirmar que la app compila (`npm run build`).
- Confirmar que los endpoints de health están accesibles.
- Revisar logs de webhooks (Stripe/Calendly/Meta) por 10-15 min y verificar que no hay `INVALID_SIGNATURE` / `NOT_CONFIGURED`.
- Si usás cron: verificar que `POST /api/cron/worker-tick` está corriendo y no devuelve 5xx.
