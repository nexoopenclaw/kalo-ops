# Sprint 18 · RBAC Enforcement + Realtime Inbox Backbone

## Objetivo
Cerrar gaps críticos post Sprint 17 en backend/API y operación inbox:
1. **RBAC server-side real** en rutas sensibles (leads/deals/automation/inbox).
2. **Backbone realtime Supabase-native** para conversaciones/mensajes, con degradación segura.
3. **Presence + assignment hints** para coordinación de setters/closers.

## Entregables

### 1) Capa RBAC
- Nuevo helper: `src/lib/authz/index.ts`
  - `requireRole(ctx, allowedRoles)`
  - `canAccessLead(ctx, leadId)`
  - `canTransitionDeal(ctx, dealId, nextStage)`
- Roles soportados: `owner`, `admin`, `setter`, `closer`, `viewer`.
- Rutas cubiertas con guardas:
  - `api/leads/*`
  - `api/deals/*`
  - `api/automations/*` (+ queue/simulate)
  - `api/messages/send`
  - `api/inbox/*`
- Esquema de error consistente:
  - `{ ok: false, error: { code, message, details? } }`

### 2) Realtime inbox backbone
- `InboxWorkspace` ahora monta subscription scaffold con `supabase.channel(...)` a:
  - `public.conversations`
  - `public.messages`
- Badge de conexión realtime:
  - `connected`
  - `degraded`
  - `offline`
- Fallback si no hay credenciales o canal falla:
  - polling local periódico + estado `degraded/offline`

### 3) Presence + assignment hints
- Sidebar inbox muestra presencia por owner/setter (mock + actualizable).
- Endpoint nuevo para señal de asignación:
  - `POST /api/inbox/assignment-ping`
- Endpoint nuevo de presencia:
  - `GET /api/inbox/presence`

## Criterios de aceptación
- [ ] Usuario `viewer` puede leer leads/inbox pero no crear/editar ni enviar mensajes.
- [ ] Usuario `setter` no puede cerrar deal a `won/lost` fuera de reglas.
- [ ] Usuario `admin/owner` puede gestionar automations y cola.
- [ ] Rutas protegidas devuelven `RBAC_FORBIDDEN` cuando aplique.
- [ ] Inbox renderiza badge realtime y no rompe sin env vars Supabase.
- [ ] Presencia/owner hints visibles en sidebar.

## Plan de rollout
1. **Deploy staging** con variables Supabase completas.
2. Validar smoke tests RBAC por rol con JWT reales.
3. Verificar suscripción realtime (insert/update en `messages` y `conversations`).
4. Monitorear `CHANNEL_ERROR/TIMED_OUT` y fallback UI.
5. Promover a producción con checklist de claves.

## Riesgos conocidos
- Realtime depende de publicación/config de tablas en Supabase Realtime.
- UI de presencia es mock-first hasta integrar heartbeat real por usuario.
- Algunas rutas legacy fuera de scope aún no usan helper authz.

## Variables/keys necesarias
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- JWT válido por usuario para rutas API protegidas (`Authorization: Bearer <token>`)
