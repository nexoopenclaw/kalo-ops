# PRD Coverage Status · Sprint 14

| PRD Area | Status | Evidence (route/file/api) | Next action |
|---|---|---|---|
| Foundation (auth + setup) | Partial | `/auth/login`, `/auth/register`, `src/lib/supabase/*` | Cerrar onboarding real con membership/roles persistidos en Supabase + RLS activo. |
| Unified Inbox + Setter OS | Partial | `/inbox`, `src/components/inbox/inbox-workspace.tsx`, `/api/messages/send`, `/api/leads/*` | Conectar inbox a Meta Graph real + realtime + asignación round-robin persistida. |
| CRM + Pipeline ventas | Partial | `/crm`, `src/lib/crm-service.ts`, `/api/deals/update-stage`, `/api/analytics/funnel-summary` | Implementar Kanban drag&drop persistido + integración Stripe webhook a `won`. |
| Pipeline risk automation + alerting | **Done (Sprint 14)** | `/hoy`, `src/lib/risk-automation-service.ts`, `/api/risk/cockpit`, `/api/risk/scan`, `/api/risk/workflows/toggle` | Persistir escaneos/alertas en Supabase (`risk_alert_events`, `risk_workflow_states`) y programar cron horario. |
| Automation engine base | Partial | `/automations`, `src/lib/automation-service.ts`, `/api/automations/*` | Pasar de mock in-memory a execution engine real con logs y dispatch por canal. |
| AI Copilot | Partial | `/copilot`, `src/lib/copilot-service.ts`, `/api/copilot/*` | Integrar proveedor LLM real con telemetría de latencia y feedback loop. |
| Voice notes + compliance | Partial | `/voice-lab`, `src/lib/voice-service.ts`, `/api/voice/*` | Integrar proveedor TTS real y auditoría inmutable en DB. |
| Content Attribution | Partial | `/attribution`, `src/lib/attribution-service.ts`, `/api/attribution/*` | Mapear origen real DM→pieza con metadata de Instagram y touchpoints multi-canal. |
| Executive reporting (daily/weekly + exports) | Partial | `/reportes`, `/api/reports/daily-preview`, `/api/reports/weekly-preview`, `/api/reports/alerts/upsert` | Añadir generación programada + delivery real (email/slack/whatsapp) + export PDF/CSV funcional. |
| Multicanal + webhook reliability | Partial | `/ops`, `/webhooks`, `/api/channels/*`, `/api/webhooks/*`, `docs/SPRINT_11_MULTICHANNEL.md`, `docs/SPRINT_12_WEBHOOK_RELIABILITY.md` | Completar adapters productivos Instagram/WhatsApp/email + reintentos con cola persistida. |
| Onboarding + customer health | Done | `/onboarding`, `/health`, `src/lib/onboarding-service.ts`, `src/lib/health-service.ts`, `/api/onboarding/*`, `/api/health/*` | Persistencia Supabase + snapshots diarios + filtros de escala. |
| Scale ecosystem (Meta Ads/HubSpot/API pública/marketplace) | Missing | PRD Fase 5 sin rutas ni APIs de integración enterprise | Priorizar API pública + outbound webhooks para integraciones n8n/Make. |
