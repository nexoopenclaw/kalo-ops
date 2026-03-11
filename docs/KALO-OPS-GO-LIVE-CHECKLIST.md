# Kalo Ops — Go-Live Checklist (MVP)

Objetivo: pasar de "anda en dev" a "safe en producción" con lo mínimo necesario.

## 1) Config & Secrets (keys-ready)

- [ ] Setear `HEALTH_ENDPOINT_TOKEN` (protege endpoints de health/config).
- [ ] Verificar `/api/health/config` (con header `x-health-token`) → **missing = []**.
- [ ] Verificar `/api/health/go-live` (con header `x-health-token`) → **ok=true**.

Providers (env vars esperadas):
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Meta: `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN`, `INSTAGRAM_ACCESS_TOKEN`, ...
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Calendly: `CALENDLY_ACCESS_TOKEN`, `CALENDLY_WEBHOOK_SIGNING_KEY`, `CALENDLY_ORGANIZATION_URI`
- Slack: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_DEFAULT_CHANNEL`
- Email (Resend): `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`
- AI: `AI_PROVIDER`, `OPENAI_API_KEY`, `AI_MODEL_DEFAULT`
- Voice: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`

## 2) DB readiness

- [ ] `GET /api/supabase/ping` → ok=true.
- [ ] Migraciones aplicadas en Supabase (tablas core: organizations, users, leads, conversations/messages, deals, integrations).

## 3) Webhooks (integrations)

- [ ] Stripe webhook endpoint configurado + firma validada.
- [ ] Calendly webhook endpoint configurado + signing key validada.
- [ ] Meta webhooks: verify token ok + eventos entrantes confirmados.

## 4) Observabilidad mínima

- [ ] Logs: errores y warnings visibles (Vercel logs / provider logs).
- [ ] Health endpoints protegidos con token.
- [ ] Si usamos Sentry: DSN configurado y release tag (commit sha) presente.

## 5) Smoke tests pre-release

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Login / onboarding básico.
- [ ] Inbox UI carga sin romper.
- [ ] Al menos 1 evento de webhook (Stripe o Calendly) impacta en estado.

---

## Endpoint recomendado

- `/api/health/go-live` (header `x-health-token`) devuelve:
  - `checks.config`: status de env vars presentes/missing
  - `checks.supabase`: conectividad DB

