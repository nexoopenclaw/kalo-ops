# KALO OPS — Roadmap de Desarrollo
**Última actualización:** 2026-03-03  
**Duración total planificada:** 32 semanas (~8 meses)

---

## Vista General de Fases

```
SEMANAS:  1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16   17   18   19   20   21   22   23   24   25   26   27   28   29   30   31   32
          |---------- FASE 1 (Foundation) ----------|---- FASE 2 (CRM) ----|------------ FASE 3 (Automation & AI) ------------|-------------- FASE 4 (Attribution) -----------|------------ FASE 5 (Scale) ------------|
```

---

## FASE 1 — Foundation & Core Inbox
**Semanas 1–6 | Equipo: 2 devs + 1 diseñador**  
**Objetivo:** Producto funcional que reemplace la operación manual de DMs con estructura y datos.

### Sprint 1 (Sem. 1-2) — Project Setup & Auth
- [ ] Setup repo, CI/CD (Vercel + GitHub)
- [ ] Proyecto Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [ ] Setup Supabase (DB, Auth, Storage, Realtime)
- [ ] Diseño de esquema de base de datos v1 (organizations, users, leads, conversations, messages)
- [ ] Autenticación: email/password + OAuth Google
- [ ] Onboarding básico de organización (nombre, logo, invitar primer setter)
- [ ] Sistema de roles: Owner, Admin, Setter, Closer, Viewer

### Sprint 2 (Sem. 3-4) — Meta Integration & Inbox Core
- [ ] Registro y aprobación de app en Meta Developer Console
- [ ] Flow OAuth para conectar cuenta de Instagram Business
- [ ] Webhooks de Meta Graph API para mensajes entrantes
- [ ] Data deletion callback (compliance Meta)
- [ ] Inbox: lista de conversaciones con realtime updates (Supabase Realtime)
- [ ] Thread de mensajes: vista completa de conversación con timestamps
- [ ] Responder mensajes directamente desde Kalo Ops (texto)
- [ ] Estados de conversación: Nuevo, Calificado, Booked, Show, Ganado, Perdido

### Sprint 3 (Sem. 5-6) — Setter OS & First Integrations
- [ ] Asignación de conversaciones a setters (manual + round-robin)
- [ ] Etiquetas custom por conversación
- [ ] Filtros de inbox: por estado, setter, tiempo sin respuesta
- [ ] Templates de respuesta configurables
- [ ] SLA tracker visual (badge temporal en leads sin respuesta)
- [ ] Integración Calendly webhook: booking → estado "Booked" automático
- [ ] Dashboard Day-1: métricas básicas (leads por estado, tiempo promedio de respuesta)
- [ ] Notificaciones básicas en-app

**🎯 Milestone Fase 1:** Un equipo de 3 setters puede operar el inbox de Instagram completo desde Kalo Ops. KPI: < 5 segundos de latencia.

---

## FASE 2 — CRM & Pipeline Visual
**Semanas 7–10 | Equipo: 2 devs + 1 diseñador**  
**Objetivo:** Visibilidad completa del embudo comercial con datos reales.

### Sprint 4 (Sem. 7-8) — CRM Core
- [ ] Perfil completo de lead: historial, notas, objeciones, datos de contacto
- [ ] Vista de deal con: valor estimado, probabilidad de cierre, owner, próx. pasos, fecha límite
- [ ] Pipeline Kanban configurable con drag & drop
- [ ] Historial de cambios de etapa con timestamp y usuario
- [ ] Taxonomía de objeciones (precio, timing, confianza, urgencia, competencia, otro)
- [ ] Registro de razón de pérdida al mover a "Perdido"

### Sprint 5 (Sem. 9-10) — Revenue & Analytics Básico
- [ ] Integración Stripe webhooks: payment_intent.succeeded → deal "Ganado" automático
- [ ] Vista "deals en riesgo" (sin actividad > N días)
- [ ] Búsqueda y filtros avanzados de leads/deals
- [ ] Métricas de embudo: booking rate, show-up rate, closing rate, funnel velocity (días)
- [ ] Dashboard de pipeline: revenue en juego por etapa, top objeciones del período

**🎯 Milestone Fase 2:** El founder ve en 30 segundos cuánto revenue hay en el pipeline y cuál es la probabilidad de cierre semanal.

---

## FASE 3 — Automation & AI Copilot
**Semanas 11–16 | Equipo: 2 devs + 1 AI engineer**  
**Objetivo:** Automatizar trabajo repetitivo y agregar IA como copiloto de ventas.

### Sprint 6 (Sem. 11-12) — Automation Engine
- [ ] Editor visual de automaciones (no-code: trigger → condición → acción)
- [ ] Triggers: silencio N horas, palabra clave, etapa de deal, booking, pago
- [ ] Acciones: enviar mensaje, cambiar estado, asignar setter, notificar Slack/email, agregar tag
- [ ] Away Mode: toggle de operación automática off-hours
- [ ] Follow-up sequences: editor de secuencias multi-paso con delay
- [ ] Logs de ejecución de automaciones
- [ ] Testing manual de automaciones antes de activar

### Sprint 7 (Sem. 13-14) — AI Copilot Core
- [ ] Integración Google Gemini API
- [ ] Sugerencias de respuesta en tiempo real (< 3 segundos)
- [ ] Clasificador de objeciones automático (precio, timing, confianza, urgencia, competencia)
- [ ] Resumen de conversación on-demand para handoffs
- [ ] Score de calidad de conversación (rubrica: claridad, empatía, CTA, manejo objeción)

### Sprint 8 (Sem. 15-16) — Voice Notes & A/B Testing
- [ ] Integración ElevenLabs API
- [ ] Flow de consentimiento explícito para activar voz clonada (con términos claros)
- [ ] Editor de texto → preview de audio → enviar como nota de voz
- [ ] Audit log completo de voice notes enviadas
- [ ] Revocación de voz clonada (elimina modelo + desactiva feature)
- [ ] A/B testing de scripts/openers con estadísticas de performance (reply rate por variante)
- [ ] Dashboard de A/B: ganador automático por significancia estadística

**🎯 Milestone Fase 3:** Un setter maneja 3x más conversaciones con misma calidad. Away Mode activo fuera de horario sin pérdida de leads.

---

## FASE 4 — Content Attribution & Executive Reporting
**Semanas 17–22 | Equipo: 2 devs + 1 diseñador**  
**Objetivo:** Cerrar el loop entre contenido y revenue con datos reales.

### Sprint 9 (Sem. 17-18) — Content Attribution Engine
- [ ] Biblioteca de piezas de contenido (posts, reels, stories) via Instagram API
- [ ] Mapeo automático: DM → pieza de contenido de origen (URL de referencia en mensaje)
- [ ] UI de atribución: por pieza → leads generados, calls booked, ventas, revenue
- [ ] Ranking de hooks/ángulos por performance
- [ ] Vista "$ por pieza" (revenue atribuido / revenue directamente trackeable)

### Sprint 10 (Sem. 19-20) — Reporting Automático
- [ ] Daily Digest: generación automática + delivery por email (Resend)
- [ ] Daily Digest: integración con Slack (bot message)
- [ ] Weekly Review: generación cada lunes, bottlenecks, top performers
- [ ] Sistema de alertas configurables:
  - Lead VIP sin respuesta > N min
  - Caída de show-up rate > X%
  - Pico de inbounds
  - Setter con backlog > N leads
- [ ] Configuración de alertas por usuario (threshold + canal)

### Sprint 11 (Sem. 21-22) — Reports & Export
- [ ] Dashboard ejecutivo completo (visual + interactivo)
- [ ] Exportación de reportes en PDF y CSV
- [ ] Comparativas semana vs. semana / mes vs. mes
- [ ] Métricas de contenido: top 5 piezas del mes, tendencias por categoría de hook
- [ ] Documentación de API interna para reporting

**🎯 Milestone Fase 4:** El founder recibe a las 8am del lunes un reporte con bottlenecks exactos y top performers del embudo y el contenido.

---

## FASE 5 — Scale & Ecosystem
**Semanas 23–32 | Equipo: 3 devs + 1 diseñador**  
**Objetivo:** Hub verdadero con ecosistema de integraciones y crecimiento.

### Sprint 12-13 (Sem. 23-26) — Nuevos Canales (WhatsApp + Email)
- [ ] WhatsApp Business Platform: inbox alternativo (bajo restricciones 2026)
- [ ] Inbox multicanal unificado (Instagram + WhatsApp + Email en una bandeja)
- [ ] Email sender integrado (SMTP/SendGrid para seguimiento)
- [ ] Zoom/Google Meet: tracking de show-up real

### Sprint 14-15 (Sem. 27-30) — Ecosystem & Integraciones Enterprise
- [ ] Meta Ads integration: CAC real por campaña
- [ ] HubSpot sync bidireccional (para clientes que ya usan HubSpot)
- [ ] Pipedrive sync bidireccional
- [ ] Webhooks salientes configurables (para conectar con n8n/Make/Zapier)
- [ ] API pública de Kalo Ops (documentada en Swagger/OpenAPI)

### Sprint 16 (Sem. 31-32) — Growth & Retention
- [ ] Onboarding guiado con checklist de "quick wins en primera semana"
- [ ] Base de knowledge/soporte integrada (docs + video walkthroughs)
- [ ] Programa de referidos (link único referral + tracking de revenue)
- [ ] Marketplace de templates de automatización (templates pre-built por industria)
- [ ] Customer health score interno para detectar clientes en riesgo de churn

**🎯 Milestone Fase 5:** MRR > $50,000 USD. Churn < 3%. Ecosystem con mínimo 3 integraciones enterprise activas.

---

## Resumen de Recursos por Fase

| Fase | Semanas | Devs | Diseñador | AI Eng | Prioridad |
|---|---|---|---|---|---|
| Foundation & Inbox | 1-6 | 2 | 1 | — | 🔴 Crítica |
| CRM & Pipeline | 7-10 | 2 | 1 | — | 🔴 Crítica |
| Automation & AI | 11-16 | 2 | — | 1 | 🟠 Alta |
| Attribution & Reporting | 17-22 | 2 | 1 | — | 🟠 Alta |
| Scale & Ecosystem | 23-32 | 3 | 1 | — | 🟡 Media |

---

## Criterios para Avanzar de Fase

Antes de avanzar de una fase a la siguiente se deben cumplir:

**Fase 1 → Fase 2:**
- Al menos 3 clientes beta con una semana completa de operación sin incidentes críticos
- Latencia de inbox demostrada < 5 segundos en P95
- 0 bugs críticos abiertos

**Fase 2 → Fase 3:**
- Booking rate y closing rate trackeados correctamente en al menos 50 deals
- Pipeline con al menos 5 stages configurados y en uso activo
- Integración Stripe funcionando para al menos 3 pagos reales

**Fase 3 → Fase 4:**
- Away Mode ejecutado correctamente > 100 veces sin intervención manual
- AI Copilot con > 80% de rating positivo de sugerencias (feedback del setter)
- 0 incidentes de privacy con voice clones

**Fase 4 → Fase 5:**
- Daily Digest entregado correctamente por 30 días consecutivos
- Al menos 10 clientes usando el content attribution activamente
- Primer case study documentado con métricas reales

---

*Roadmap v1.0 — Kalo Ops — 2026-03-03*  
*Ajustar timelines según disponibilidad real del equipo de desarrollo*
