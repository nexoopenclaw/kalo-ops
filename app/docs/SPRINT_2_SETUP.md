# Sprint 2 Setup (Meta Integration + Inbox Core)

Este documento deja listo el proceso para activar integración real cuando lleguen credenciales.

## 1) Meta App Setup Checklist (Instagram / WhatsApp)

1. Crear o reutilizar una app en **Meta for Developers**.
2. Añadir productos necesarios:
   - **WhatsApp** (si se usará WhatsApp Cloud API)
   - **Webhooks**
   - **Instagram Graph API** (si se usarán DMs de Instagram)
3. Obtener y guardar:
   - `META_APP_ID`
   - `META_APP_SECRET`
   - `META_VERIFY_TOKEN` (valor propio que tú defines)
   - `META_ACCESS_TOKEN` (system user o token de larga duración)
   - `META_PHONE_NUMBER_ID` (solo WhatsApp)
   - `META_BUSINESS_ACCOUNT_ID` / `META_WABA_ID` según canal
4. Configurar permisos requeridos en la app (según canal):
   - WhatsApp: `whatsapp_business_messaging`, `whatsapp_business_management`
   - Instagram: permisos de mensajes y lectura según el caso de uso
5. Vincular activos (número, página, IG account) al Business Manager correcto.
6. Pasar app a modo Live cuando toque producción.

## 2) Supabase Env Vars

Completar `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=
META_ACCESS_TOKEN=
META_PHONE_NUMBER_ID=
META_BUSINESS_ACCOUNT_ID=
```

> Nota: `SUPABASE_SERVICE_ROLE_KEY` solo en backend (API routes/server actions), nunca en cliente.

## 3) Webhook URL Path

El endpoint implementado en Sprint 2 es:

```text
POST /api/webhooks/meta
```

URL final por entorno:

- Local (con tunnel): `https://<tu-tunnel>/api/webhooks/meta`
- Prod: `https://<tu-dominio>/api/webhooks/meta`

Cabecera de firma esperada:

- `x-hub-signature-256`

## 4) Flujo de activación cuando lleguen credenciales

1. Cargar variables en `.env.local` y entorno de deploy.
2. Aplicar `db/schema.sql` en Supabase SQL Editor.
3. Sustituir en `src/lib/inbox-service.ts` el modo mock por consultas reales.
4. Completar TODOs en:
   - `src/app/api/webhooks/meta/route.ts`
   - `src/app/api/messages/send/route.ts`
5. Probar recepción de eventos con webhook de prueba de Meta.
6. Verificar persistencia de conversaciones/mensajes y actualización de SLA/unread.

## 5) Validación rápida

- `npm run lint`
- `npm run build`
- Enviar mock:
  - `POST /api/messages/send`
- Recibir mock:
  - `POST /api/webhooks/meta`
