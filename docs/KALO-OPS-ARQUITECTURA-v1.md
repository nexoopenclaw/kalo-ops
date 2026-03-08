# KALO OPS — Arquitectura Técnica
**Versión:** 1.0 | **Fecha:** 2026-03-03

---

## Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES / USUARIOS                      │
│            Founder, Setters, Closers (browser + mobile web)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL EDGE NETWORK                          │
│                   Next.js 14 (App Router)                        │
│     Pages / Components  │  API Routes  │  Middleware Auth         │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────────┐
│  SUPABASE CORE   │ │  EDGE FUNCTIONS  │ │  EXTERNAL SERVICES   │
│                  │ │                  │ │                      │
│  PostgreSQL DB   │ │  Meta Webhook    │ │  Meta Graph API      │
│  Auth (JWT/OAuth)│ │  Stripe Webhook  │ │  Stripe              │
│  Realtime        │ │  Calendly Hook   │ │  Calendly            │
│  Storage         │ │  Daily Digest    │ │  ElevenLabs (TTS)    │
│  Row Level Sec.  │ │  Follow-up Cron  │ │  Google Gemini AI    │
│                  │ │  Alert Engine    │ │  Slack / Resend      │
└──────────────────┘ └─────────────────┘ └──────────────────────┘
```

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| Next.js | 14.x (App Router) | Framework principal |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling utility-first |
| shadcn/ui | Latest | Component library |
| Zustand | 4.x | Client state management |
| TanStack Query | 5.x | Server state + caching |
| Recharts | 2.x | Visualizaciones y dashboards |
| Framer Motion | 11.x | Animaciones UI |

### Backend
| Tecnología | Versión | Rol |
|---|---|---|
| Next.js API Routes | 14.x | REST API endpoints |
| Supabase | Latest | Auth + DB + Storage + Realtime |
| PostgreSQL | 15.x | Base de datos relacional |
| Supabase Edge Functions | Deno runtime | Procesamiento webhooks + crons |
| Supabase Realtime | Latest | Inbox live updates (WebSocket) |

### Servicios externos (Fases 1-2)
| Servicio | Propósito | Criticidad |
|---|---|---|
| Meta Graph API v21 | Inbox DMs de Instagram | 🔴 Crítico |
| Stripe | Pagos SaaS + webhooks deals | 🔴 Crítico |
| Calendly API | Webhook de bookings | 🟠 Alta |
| Resend | Email transaccional y reportes | 🟠 Alta |
| Google Gemini 1.5 Pro | AI Copilot y clasificación | 🟠 Alta (Fase 3) |
| ElevenLabs | Voice cloning TTS | 🟡 Media (Fase 3) |
| Slack API | Delivery de reportes y alertas | 🟡 Media |

---

## Modelo de Datos — Esquema Principal

### Tabla: `organizations` (Multi-tenant root)
```sql
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  logo_url    TEXT,
  plan        TEXT DEFAULT 'starter', -- starter/growth/scale/enterprise
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `users` (miembros del equipo)
```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role            TEXT DEFAULT 'setter', -- owner/admin/setter/closer/viewer
  full_name       TEXT,
  avatar_url      TEXT,
  timezone        TEXT DEFAULT 'America/Buenos_Aires',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `integrations` (cuentas conectadas)
```sql
CREATE TABLE integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type            TEXT NOT NULL, -- instagram/stripe/calendly/slack/whatsapp
  credentials     JSONB, -- access_token, account_id (encriptado en aplicación)
  metadata        JSONB DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  connected_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `leads` (contactos/prospectos)
```sql
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  external_id     TEXT, -- IG user ID, WhatsApp number, etc.
  channel         TEXT DEFAULT 'instagram', -- instagram/whatsapp/email
  full_name       TEXT,
  username        TEXT,
  profile_url     TEXT,
  status          TEXT DEFAULT 'new', -- new/qualified/booked/show/won/lost
  assigned_to     UUID REFERENCES users(id),
  deal_value      DECIMAL(10,2),
  lost_reason     TEXT,
  notes           TEXT,
  tags            TEXT[] DEFAULT '{}',
  source_content_id UUID, -- atribución: qué pieza generó este lead
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `conversations` (threads de mensajes)
```sql
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  external_thread_id TEXT, -- ID del thread en Instagram/WhatsApp
  last_message_at TIMESTAMPTZ,
  unread_count    INT DEFAULT 0,
  sla_alert_at    TIMESTAMPTZ, -- cuándo activar alerta de SLA
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `messages` (mensajes individuales)
```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  external_msg_id TEXT, -- ID original del mensaje en la plataforma
  direction       TEXT NOT NULL, -- inbound/outbound
  content         TEXT,
  type            TEXT DEFAULT 'text', -- text/voice/image/video
  media_url       TEXT,
  voice_model_used TEXT, -- null si no es voice note clonada
  sent_by         UUID REFERENCES users(id), -- null si fue automático
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  metadata        JSONB DEFAULT '{}'
);
```

### Tabla: `deals` (pipeline de ventas)
```sql
CREATE TABLE deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT,
  stage           TEXT DEFAULT 'prospecting',
  value           DECIMAL(10,2),
  probability     INT DEFAULT 0, -- 0-100%
  owner_id        UUID REFERENCES users(id),
  close_date      DATE,
  stripe_payment_id TEXT,
  lost_reason     TEXT,
  objections      JSONB DEFAULT '[]', -- [{type, text, resolved}]
  next_steps      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `content_pieces` (piezas de contenido)
```sql
CREATE TABLE content_pieces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform        TEXT DEFAULT 'instagram', -- instagram/youtube/tiktok
  external_id     TEXT, -- ID del post en la plataforma
  type            TEXT, -- reel/story/post/video
  title           TEXT,
  hook            TEXT,
  url             TEXT,
  thumbnail_url   TEXT,
  published_at    TIMESTAMPTZ,
  -- métricas calculadas
  leads_generated INT DEFAULT 0,
  calls_booked    INT DEFAULT 0,
  deals_won       INT DEFAULT 0,
  revenue_attributed DECIMAL(10,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `automations` (workflows)
```sql
CREATE TABLE automations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  is_active       BOOLEAN DEFAULT FALSE,
  trigger_type    TEXT NOT NULL, -- silence/keyword/stage_change/booking/payment
  trigger_config  JSONB NOT NULL, -- {hours: 48} or {keyword: "precio"} etc.
  conditions      JSONB DEFAULT '[]',
  actions         JSONB NOT NULL, -- [{type: "send_message", template_id: "..."}]
  execution_count INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `audit_logs` (trazabilidad completa)
```sql
CREATE TABLE audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id         UUID REFERENCES users(id),
  action          TEXT NOT NULL, -- send_voice_note/change_status/login/etc.
  resource_type   TEXT,
  resource_id     UUID,
  metadata        JSONB DEFAULT '{}',
  ip_address      INET,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS)

Todos los datos están protegidos por RLS en Supabase. Principio base:

```sql
-- Ejemplo de política para leads
CREATE POLICY "Users can only see their organization's leads"
ON leads FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
  )
);

-- Setters solo ven sus leads asignados
CREATE POLICY "Setters see only assigned leads"
ON leads FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin', 'closer')
  OR assigned_to = auth.uid()
);
```

---

## Flujo de Webhooks — Instagram DMs

```
Instagram (lead envía DM)
        │
        ▼
Meta Graph API Webhook
        │  POST /api/webhooks/meta
        ▼
Supabase Edge Function: process-meta-webhook
        │
        ├─ Verifica firma HMAC del request
        ├─ Identifica organización por account ID
        ├─ Crea o encuentra el lead (by IG user ID)
        ├─ Crea el mensaje en tabla messages
        ├─ Actualiza last_message_at en conversations
        ├─ Triggers automations engine (si aplica)
        ├─ Emite realtime event → Supabase Realtime Channel
        │         └─ Frontend recibe evento WebSocket
        │             └─ Inbox se actualiza instantáneamente
        └─ Evalúa SLA → si lead VIP sin respuesta, crea alerta
```

---

## Flujo de Away Mode

```
Founder activa "Away Mode"
        │
        ▼
Sistema marca organización: away_mode = true
        │
DM entrante llega
        │
        ▼
process-meta-webhook detecta away_mode = true
        │
        ▼
Automation Engine evalúa: ¿hay workflow activo para "new_message"?
        │
        ├─ SÍ → Ejecuta acción (enviar template, etc.) via Meta API
        └─ NO → Solo loguea, crea SLA alert para revisión al volver
```

---

## Seguridad y Compliance

### Datos sensibles
- **Access tokens de Meta/Stripe:** encriptados en aplicación antes de guardar en JSONB de `integrations`
- **Voice model credentials:** solo accesibles desde Edge Functions (nunca expuestas al frontend)
- **Audit logs:** inmutables (no hay DELETE policy en audit_logs)

### GDPR / Data Deletion
- Endpoint `DELETE /api/gdpr/lead/:id` que elimina todos los mensajes y datos personales del lead
- Al desconectar integración de Instagram: data deletion callback ejecutado automáticamente (requerido por Meta)
- Retención de datos: configurable por organización (default: 90 días de inactividad)

### Rate limiting
- API Routes con rate limiting por IP y por JWD user
- Webhooks de Meta verificados con HMAC SHA-256
- Edge Functions con timeout máximo de 30 segundos

---

*Arquitectura v1.0 — Kalo Ops — 2026-03-03*
