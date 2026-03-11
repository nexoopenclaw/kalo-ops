# GO_LIVE_KEYS_CHECKLIST

Checklist operativo para dejar **Kalo Ops keys-ready** y pasar a producción sin fricción.

## 1) Variables de entorno requeridas

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Meta (Instagram / WhatsApp)
- `META_APP_ID`
- `META_APP_SECRET`
- `META_VERIFY_TOKEN`
- `INSTAGRAM_ACCESS_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

### Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Calendly
- `CALENDLY_ACCESS_TOKEN`
- `CALENDLY_WEBHOOK_SIGNING_KEY`
- `CALENDLY_ORGANIZATION_URI`

### Resend / Email
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`

### Slack
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `SLACK_DEFAULT_CHANNEL`

### AI Provider
- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `AI_MODEL_DEFAULT`

### ElevenLabs
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `ELEVENLABS_MODEL_ID`

## 2) Dónde cargarlas

## Vercel (app Next.js)
1. Ir a **Project → Settings → Environment Variables**.
2. Cargar todas las keys en `Production` y `Preview`.
3. Redeploy de `main` al terminar.

## Supabase
1. Ir a **Project Settings → Edge Functions → Secrets**.
2. Cargar las keys usadas por funciones/webhooks server-side.
3. Re-deploy de funciones si aplica.

## 3) Smoke tests iniciales

1. Entrar a `/integraciones` y revisar estado por proveedor.
2. Llamar `GET /api/integrations/status`:
   - Esperado: `isFullyConfigured=true`
   - Esperado: `missingKeys=[]`
3. Ejecutar `POST /api/integrations/test/:provider` para cada proveedor:
   - **Por defecto** corre un test “mock-safe” (solo valida presencia de env).
   - Para hacer un **live ping real** contra los proveedores, setear en el deploy:
     - `INTEGRATIONS_LIVE_TESTS=1`
     - (opcional) `INTEGRATIONS_TEST_TIMEOUT_MS=8000`
   - Esperado: `status=ok`
4. Disparar pruebas funcionales reales:
   - Webhook de Stripe de prueba
   - Mensaje de prueba IG/WhatsApp
   - Evento de Calendly
   - Correo real por Resend
   - Alerta de Slack

## 4) Criterio de salida (go-live)

- Todas las integraciones en `Configurado`
- Todos los tests de `/api/integrations/test/:provider` en `ok`
- Smoke tests end-to-end aprobados sin errores críticos
