# KALO OPS — Product Requirements Document (PRD)
**Versión:** 1.0  
**Fecha:** 2026-03-03  
**Autor:** Equipo Kalo / Antigravity  
**Estado:** Draft para revisión estratégica

---

## 0. Resumen Ejecutivo

**Kalo Ops** es el sistema operativo central para negocios digitales de información — coaches, consultores, creadores, agencias y productores de contenido que venden servicios o productos de alto ticket.

El problema que resuelve es doble:
1. **Fragmentación operativa:** hoy los equipos de ventas digitales operan con una mezcla caótica de DMs de Instagram, hojas de cálculo, Notion, Calendly, WhatsApp y Stripe totalmente desconectados entre sí.
2. **Ceguera de datos:** no saben qué pieza de contenido generó un lead, qué setter está fallando, ni por qué los leads mueren sin convertir.

Kalo Ops convierte ese caos en **un sistema operativo medible**: inbox unificado, CRM con pipeline, atribución de contenido a revenue, automatizaciones y reporting ejecutivo con IA. Todo en una sola plataforma.

**Propuesta de valor central:**  
> "Tu negocio deja de ser una mezcla de DMs y planillas y se convierte en un sistema operativo de crecimiento medible."

---

## 1. Contexto y Oportunidad de Mercado

### 1.1 El mercado objetivo

| Segmento | Descripción | Tamaño estimado |
|---|---|---|
| Info-businesses en LATAM | Coaches, consultores, mentores, infoproductores | Millones de creadores activos |
| Agencias digitales boutique | Agencias de performance, contenido, paid media | Decenas de miles de agencias |
| Creadores con comunidad | YouTubers, podcasteros con productos propios | Mercado en hipercrecimiento |
| Negocios de alto ticket | Masterminds, programas, consulting | Precio promedio $2,000–$15,000 USD |

### 1.2 Pain points críticos validados

Extraídos del análisis competitivo de `themochi.app` y `mochi.global`:

1. **El setter humano es insostenible:** cuesta $5,000+/mes, solo opera 8h/día, maneja 25-40 convos diarias, tarda 3-6 meses en ser productivo.
2. **Los leads mueren por velocidad:** el Lead Response Management Study (MIT/InsideSales) documenta caídas enormes en contactabilidad al superar 5 minutos de espera.
3. **No hay atribución de contenido:** los creadores no saben qué reel trajo plata.
4. **Los equipos trabajan sin proceso:** sin estados, sin SLAs, sin pipeline visible.
5. **Los reportes son manuales:** alguien pasa horas en una planilla para saber cómo está el embudo.

### 1.3 Competidores analizados

| Producto | Fortaleza | Debilidad para nuestro mercado |
|---|---|---|
| themochi.app | AI Setter + voz clonada + attribution | Solo para mercado anglófono, precio alto ($375/mes), no tiene team ops |
| mochi.global | Suite completa para PYMEs | Enfocado en Malasia, no en creadores digitales, muy complejo |
| GoHighLevel | CRM + funnels | Curva de aprendizaje enorme, demasiado genérico |
| Manychat | Automatización de DMs | No tiene CRM completo, no tiene reporting ejecutivo |
| HubSpot | CRM poderoso | No integra DMs de IG, precio alto, no apto para creators |

**Brecha de mercado:** no existe una solución en español, orientada a negocios digitales LATAM, que integre nativamente inbox de DMs + CRM + atribución de contenido + reporting IA en una sola herramienta.

---

## 2. Visión del Producto

### 2.1 Nombre y posicionamiento

**Nombre:** Kalo Ops  
**Tagline:** "El sistema operativo de tu negocio digital."  
**Posicionamiento:** No es un CRM. No es un chatbot. Es el hub central desde donde el founder o el equipo de ventas ve todo, opera todo y optimiza todo sin saltar entre herramientas.

### 2.2 Principios de diseño

1. **One-screen operations:** todo lo que el setter necesita para trabajar en un día debe estar en una sola pantalla.
2. **Data-first:** cada acción genera un dato. Cada dato genera una insight. Cada insight genera una acción sugerida.
3. **IA incidental, no protagonista:** la IA ayuda en el proceso de ventas (sugerencias, resúmenes, drafts), pero el control siempre está en el humano.
4. **Velocidad sobre perfección:** las integraciones primarias deben ser las más usadas (Instagram, Calendly, Stripe). El resto puede esperar.
5. **Modular y escalable:** el MVP lanza con el core. Cada módulo extra se activa como "addon".

---

## 3. Módulos del Producto (Scoped por Fases)

### Módulo 1 — Unified Inbox + Setter OS (CORE)

El corazón operativo de Kalo Ops. Donde el equipo de ventas pasa el 80% de su día.

**Funcionalidades:**
- Bandeja central de conversaciones (inicialmente Instagram DMs, luego WhatsApp)
- El founder no da acceso a su cuenta personal: el equipo trabaja desde Kalo Ops
- Distribución automática de leads entre setters (round-robin o manual)
- Estados de conversación: `Nuevo → Calificado → Booked → Show → Ganado → Perdido`
- Etiquetas automáticas asignadas por IA según contexto de la conversación
- **Away Mode:** cuando el equipo se desconecta, el modo automatizado toma conversaciones
- Notas de voz con voz clonada del founder (opt-in explícito, con log de auditoría)
- Follow-ups automáticos por comportamiento (silencio 48h → activa secuencia X)
- Templates y playbooks de respuesta editables por conversación
- SLA tracking: alerta cuando un lead VIP lleva más de N minutos sin respuesta

### Módulo 2 — CRM + Pipeline de Ventas

Visión comercial completa del embudo.

**Funcionalidades:**
- Perfil de lead/cliente: historial completo, notas, objeciones registradas, owner del deal
- Pipeline visual tipo Kanban con etapas configurables
- Tarjetas de deal con: valor estimado, probabilidad de cierre, próximos pasos, fecha límite
- Registro de razones de pérdida (taxonomía de objeciones)
- Vista de "deals en riesgo" (deals sin actividad > N días)
- Integración con Calendly/Google Calendar: booking automático → crea deal en el pipeline
- Integración con Stripe: pago confirmado → deal marcado como "Ganado" automáticamente
- Filtros avanzados: por setter, por fuente, por etapa, por período

### Módulo 3 — Content Attribution (Atribución de Contenido)

Lo que ningún competidor hace bien para creadores.

**Funcionalidades:**
- Conexión con Instagram para identificar desde qué story/reel/post llegó cada DM
- Biblioteca de piezas de contenido con métricas reales: leads generados, llamadas booked, ventas cerradas, revenue atribuido
- Ranking de "ángulos/hooks que convierten" vs. los que solo generan ruido
- Vista "$ por pieza": ROI real de cada post
- Sugerencias de próximos contenidos basadas en performance histórico

### Módulo 4 — Reporting Ejecutivo + Alertas

El dashboard del founder. Sin humo.

**Funcionalidades:**
- **Daily Digest** (entrega automática por email/Slack/WhatsApp a las 8am):
  - Leads nuevos del día anterior
  - Reply rate por setter
  - Bookings generados
  - Backlog actual
  - Top objeción del día
- **Weekly Review** (cada lunes):
  - Bottlenecks del embudo (dónde están muriendo los leads)
  - Top scripts ganadores
  - Top contenido generador de revenue
  - Comparativa vs. semana anterior
- **Alertas en tiempo real:**
  - Lead VIP sin respuesta > 15 minutos
  - Caída de show-up rate > 20%
  - Pico de inbounds (para rebalancear equipo)
  - Setter con backlog > N leads

### Módulo 5 — AI Copilot

Asistencia real en el proceso de ventas, no un chatbot genérico.

**Funcionalidades:**
- Sugerencia de respuesta contextual (basada en historial + oferta + objeción detectada)
- Resumen de conversación para handoff founder ↔ setter ↔ closer
- Detección automática de objeción: precio, timing, confianza, urgencia, competencia
- A/B testing de openers y follow-ups con estadísticas de performance
- Score de conversación: rubrica de calidad (claridad, empatía, CTA, manejo objeción)
- Draft de notas de voz: el setter escribe el concepto, la IA genera el texto para TTS

---

## 4. Integraciones

### Fase 1 — MVP (Obligatorias)

| Integración | Propósito |
|---|---|
| **Instagram / Meta Graph API** | Inbox de DMs, webhooks de mensajes entrantes, atribución de contenido |
| **Calendly** | Captura de bookings, trigger de deal en CRM |
| **Google Calendar** | Sync de llamadas, recordatorios de show-up |
| **Stripe** | Confirmación de pagos → cierre automático de deals |
| **Slack** | Delivery de daily digest y alertas al equipo |
| **ElevenLabs** | Voice cloning para notas de voz (con consentimiento explícito) |

### Fase 2 — Escala (Post-MVP)

| Integración | Propósito |
|---|---|
| **WhatsApp Business Platform** | Inbox alternativo (con restricciones de WhatsApp Terms 2026) |
| **Email (SMTP/SendGrid)** | Follow-ups y reportes por email |
| **Zoom / Google Meet** | Tracking de show-up real en llamadas |
| **Meta Ads** | CAC real y ROAS por campaña |
| **HubSpot / Pipedrive / GoHighLevel** | Sync bidireccional para clientes que ya usan CRM |
| **n8n / Make / Zapier** | Automatizaciones custom tipo "lego system" |
| **BigQuery / Metabase** | Data warehouse para analytics avanzado |

### Notas críticas de compliance

> ⚠️ **Meta APIs:** las integraciones de inbox/mensajería dependen de aprobación de aplicación con Meta. Hay que diseñar el flujo de OAuth y data deletion callbacks desde el MVP.

> ⚠️ **WhatsApp Business Terms (vigentes desde 15 Jan 2026):** prohíben usar WhatsApp como plataforma de IA general-purpose. Kalo Ops debe presentarse como **software de operación comercial** donde la IA es incidental (asistencia a ventas/soporte), no protagonista.

---

## 5. KPIs y Métricas del Producto

### 5.1 Métricas de conversación / DMs

| Métrica | Descripción |
|---|---|
| Reply Rate | % de leads que responden al primer mensaje |
| Time to First Response (TTFR) | Tiempo desde DM entrante a primera respuesta humana/IA |
| SLA Compliance | % de leads respondidos en < 5 min / 15 min / 60 min |
| Lead Contactability | % de leads con los que se logra una conversación real |
| Objection Rate | % de conversaciones donde se registra objeción |
| Objection Resolution Rate | % de objeciones manejadas exitosamente |

### 5.2 Métricas de embudo comercial

| Métrica | Descripción |
|---|---|
| Booking Rate | % de leads calificados que agendan llamada |
| Show-up Rate | % de llamadas agendadas que efectivamente suceden |
| Closing Rate | % de llamadas que terminan en venta |
| Funnel Velocity | Días promedio desde primer DM hasta venta cerrada |
| AOV | Ticket promedio de venta |
| LTV | Valor de vida del cliente (si hay renovaciones/upsells) |

### 5.3 Métricas de contenido

| Métrica | Descripción |
|---|---|
| Leads por pieza | DMs generados por cada post/reel/story |
| Calls per content piece | Llamadas booked por cada pieza |
| Revenue per content piece | Revenue atribuido a cada pieza |
| Top hooks | Ángulos/temas que más convierten |

### 5.4 KPIs de negocio (Kalo Ops como SaaS)

| KPI | Meta Fase 1 | Meta Fase 2 |
|---|---|---|
| MRR | $10,000 USD | $50,000 USD |
| Clientes activos | 30 | 150 |
| Churn mensual | < 5% | < 3% |
| NPS | > 40 | > 60 |
| CAC payback | < 90 días | < 60 días |

---

## 6. Arquitectura Técnica Propuesta

### 6.1 Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript | SSR/SSG, performance, ecosistema React |
| **Styling** | Tailwind CSS + shadcn/ui | Velocidad de desarrollo, consistencia UI |
| **Backend / API** | Next.js API Routes + Edge Functions | Serverless, scalable |
| **Base de datos** | Supabase (PostgreSQL) | RLS, realtime, auth integrado |
| **Auth** | Supabase Auth | OAuth con Google, email/password |
| **Realtime** | Supabase Realtime | Inbox live updates |
| **Storage** | Supabase Storage | Archivos de voz, assets |
| **Colas / Jobs** | Supabase Edge Functions + Cron | Follow-up automáticos, digest diario |
| **IA** | Google Gemini API | Sugerencias, resúmenes, clasificaciones |
| **TTS / Voice** | ElevenLabs API | Voice cloning para notas de voz |
| **Pagos** | Stripe | Suscripciones SaaS multi-plan |
| **Integraciones** | Meta Graph API, Calendly API, Stripe Webhooks | Core integrations del MVP |
| **Email** | Resend | Transaccional y reportes |
| **Monitoreo** | Sentry + Vercel Analytics | Error tracking + performance |
| **Deploy** | Vercel | CI/CD automático, edge network |

### 6.2 Modelo de datos (esquema principal)

```
Organizations (tenant)
  ├── Users (roles: owner, setter, closer, viewer)
  ├── Integrations (instagram_account, calendly_account, stripe_account)
  ├── Leads
  │   ├── Conversations (thread de mensajes)
  │   │   └── Messages (cada mensaje individual)
  │   ├── DealStages (stages de pipeline)
  │   └── Objections (taxonomía de objeciones)
  ├── ContentPieces (posts, reels, stories)
  │   └── ContentAttributions (lead → pieza de contenido)
  ├── Automations (workflows y secuencias)
  │   └── AutomationTriggers
  ├── Reports (snapshots de reportes)
  └── AlertConfigs (configuración de alertas)
```

### 6.3 Principios de arquitectura

- **Multi-tenant desde el día 1:** cada cliente es una `Organization` con datos completamente aislados via Supabase RLS.
- **Webhook-first:** todas las integraciones externas operan vía webhooks (Meta, Stripe, Calendly) procesados por Edge Functions.
- **Realtime UI:** el inbox se actualiza en tiempo real sin polling, usando Supabase Realtime channels.
- **Auditoria completa:** cada acción del sistema queda registrada en un audit log (especialmente crítico para las voice notes con voz clonada).

---

## 7. Roadmap por Fases

### FASE 1 — Foundation & Core Inbox (Semanas 1-6)
**Objetivo:** Tener un producto funcional que reemplace la operación manual de DMs con estructura y datos.

**Entregables:**
- [ ] Setup del proyecto (Next.js + Supabase + Vercel)
- [ ] Sistema de auth y onboarding de Organizations
- [ ] Integración con Meta Graph API (OAuth + webhook de DMs)
- [ ] Inbox unificado: lista de conversaciones + thread de mensajes
- [ ] Estados de conversación manuales (Nuevo → Calificado → Booked → etc.)
- [ ] Asignación de conversaciones a setters
- [ ] Templates de respuesta básicos
- [ ] Integración con Calendly (webhook de booking → crea "Booked" en el estado)
- [ ] Dashboard básico con métricas del día

**Criterio de éxito:** Un equipo de ventas puede operar su inbox de Instagram completo desde Kalo Ops sin tocar Instagram directamente.

---

### FASE 2 — CRM & Pipeline Visual (Semanas 7-10)
**Objetivo:** Dar visibilidad completa del embudo comercial con datos reales.

**Entregables:**
- [ ] Pipeline Kanban configurable con drag & drop
- [ ] Perfil completo de lead/deal (historial, notas, objeciones, próximos pasos)
- [ ] Taxonomía de objeciones con registro structured
- [ ] Integración con Stripe (pago confirmado → deal "Ganado" automático)
- [ ] Vista "deals en riesgo"
- [ ] Filtros y búsqueda avanzada
- [ ] Métricas de embudo: booking rate, show-up rate, closing rate, funnel velocity

**Criterio de éxito:** El founder puede ver en 30 segundos cuánto revenue hay en el pipeline y cuál es la probabilidad de cierre.

---

### FASE 3 — Automation & AI Copilot (Semanas 11-16)
**Objetivo:** Automatizar el trabajo repetitivo y agregar IA como copiloto de ventas.

**Entregables:**
- [ ] Editor de workflows de automatización (trigger → condición → acción)
- [ ] Away Mode: respuestas automáticas cuando el equipo está offline
- [ ] Follow-up sequences automáticas por comportamiento (silencio, objeción, no-show)
- [ ] AI Copilot: sugerencias de respuesta en tiempo real
- [ ] Detección automática de objeciones con clasificación
- [ ] Resumen de conversación para handoffs
- [ ] Score de calidad de conversación
- [ ] Voice notes: integración con ElevenLabs para TTS (con consentimiento logged)
- [ ] A/B testing de scripts/openers

**Criterio de éxito:** El setter puede manejar 3x más conversaciones con la misma calidad gracias al copiloto IA.

---

### FASE 4 — Content Attribution & Reporting (Semanas 17-22)
**Objetivo:** Cerrar el loop entre contenido y revenue con datos reales.

**Entregables:**
- [ ] Biblioteca de piezas de contenido conectada a Instagram
- [ ] Mapeo automático DM → pieza de contenido de origen
- [ ] Dashboard de atribución: leads / calls / revenue por pieza
- [ ] Ranking de hooks/ángulos por performance
- [ ] Daily Digest automático (email + Slack)
- [ ] Weekly Review con bottlenecks y top performers
- [ ] Sistema de alertas configurables (VIP sin respuesta, caída de show-up, etc.)
- [ ] Reportes exportables (PDF/CSV)

**Criterio de éxito:** El founder sabe cada lunes a las 8am exactamente qué está funcionando, qué no, y qué palanca mover.

---

### FASE 5 — Scale & Ecosystem (Semanas 23-32)
**Objetivo:** Convertir Kalo Ops en un hub verdadero con un ecosistema de integraciones.

**Entregables:**
- [ ] WhatsApp Business Platform (inbox alternativo)
- [ ] Integración con Zoom/Meet para tracking de show-up
- [ ] Meta Ads integration (CAC real)
- [ ] Sync con HubSpot / Pipedrive / GoHighLevel
- [ ] API pública de Kalo Ops para integraciones custom
- [ ] Marketplace de templates de automatización
- [ ] Onboarding guiado con "quick wins" en primera semana
- [ ] Programa de referidos para growth orgánico

**Criterio de éxito:** MRR > $50,000 USD con churn < 3%.

---

## 8. Modelo de Negocio

### 8.1 Planes propuestos

| Plan | Precio | Usuarios | Features |
|---|---|---|---|
| **Starter** | $97/mes | 1 setter | Inbox + CRM básico + 1 integración |
| **Growth** | $197/mes | 3 setters | Todo Starter + Automations + AI Copilot |
| **Scale** | $397/mes | 10 setters | Todo Growth + Attribution + Reporting avanzado + Voice notes |
| **Enterprise** | Custom | Ilimitado | Todo Scale + API + Onboarding dedicado + SLA |

### 8.2 Estrategia de go-to-market

1. **Founder-led sales:** el founder vende directamente en llamadas con posicionamiento "sistema operativo" (no "herramienta más")
2. **Content marketing:** demostrar el producto mostrando las métricas propias de Kalo Ops en contenido
3. **Comunidades LATAM:** entrada por grupos de coaches y creadores en español
4. **Done-for-you addon:** opción de setup asistido para clientes que no quieren configurarlo solos
5. **Case studies:** documentar resultados de primeros clientes como prueba social

### 8.3 Métricas de adopción objetivo

| Métrica | Mes 3 | Mes 6 | Mes 12 |
|---|---|---|---|
| Clientes activos | 15 | 50 | 150 |
| MRR | $3,000 | $10,000 | $40,000 |
| Churn mensual | < 8% | < 5% | < 3% |
| NPS | > 30 | > 45 | > 60 |

---

## 9. Requisitos Funcionales Detallados

### RF-001: Autenticación y gestión de organización
- El sistema debe soportar múltiples usuarios por organización con roles diferenciados (Owner, Admin, Setter, Closer, Viewer)
- El Owner puede invitar usuarios por email
- Cada usuario ve solo las conversaciones que le fueron asignadas (excepto Owner/Admin)
- SSO básico con Google (para reducir fricción de onboarding)

### RF-002: Inbox unificado
- Los mensajes entrantes de Instagram deben aparecer en tiempo real (< 5 segundos de latencia)
- El inbox debe mostrar: foto de perfil, nombre, preview del último mensaje, timestamp, estado actual, setter asignado
- Debe poder filtrar por: estado, setter, sin respuesta > N horas, con objeción detectada, contenido de origen
- El setter debe poder responder directamente desde el inbox sin salir de la aplicación, incluyendo texto y adjuntos básicos

### RF-003: CRM y pipeline
- Los leads deben moverse entre etapas con drag & drop (Kanban) o cambio de estado (desde inbox)
- Cada cambio de etapa debe quedar registrado en el historial del lead con timestamp y usuario
- Los deals "ganados" deben actualizar automáticamente las métricas de revenue del dashboard
- Las razones de pérdida deben ser categorizadas (taxonomía predefinida + custom)

### RF-004: Automatizaciones
- El editor de automaciones debe ser no-code (visual, tipo if-this-then-that)
- Los triggers deben incluir: silencio por N horas, palabra clave detectada, etapa de deal, booking realizado, pago recibido
- Las acciones deben incluir: enviar mensaje, cambiar estado, asignar setter, notificar por Slack/email, agregar tag
- Las automatizaciones deben tener logs de ejecución

### RF-005: IA Copilot
- Las sugerencias de respuesta deben generarse en < 3 segundos
- El sistema debe detectar objeciones usando clasificación automática con un mínimo de 85% de precisión
- Los resúmenes de conversación deben generarse on-demand y no requerir más de 10 segundos
- Toda interacción con IA debe ser logueable por auditoría

### RF-006: Voice Notes
- El sistema debe requerir consentimiento explícito del founder antes de activar la voz clonada
- Cada nota de voz enviada debe quedar registrada en el audit log con: timestamp, mensaje fuente, modelo de voz utilizado, usuario que inició la acción
- El founder debe poder revocar el modelo de voz en cualquier momento

### RF-007: Reporting
- El daily digest debe entregarse antes de las 8:30am hora del usuario
- Los reportes deben poder configurarse por email, Slack o ambos
- Todos los reportes deben ser exportables en PDF y CSV
- Los dashboards deben actualizarse en tiempo real (< 30 segundos de lag)

---

## 10. Requisitos No Funcionales

| Requisito | Especificación |
|---|---|
| **Performance** | P95 de carga de página < 2 segundos |
| **Uptime** | 99.5% mensual |
| **Latencia inbox** | < 5 segundos desde DM recibido hasta visible en Kalo Ops |
| **Escalabilidad** | Soportar hasta 10,000 conversaciones activas por tenant sin degradación |
| **Seguridad** | RLS habilitado, datos encriptados en reposo y en tránsito, audit logs completos |
| **Compliance** | GDPR-ready (data deletion endpoints), Meta Platform Policies, WhatsApp Business Terms |
| **Accesibilidad** | WCAG 2.1 AA para componentes críticos |
| **Mobile** | Responsive en móvil para lectura y respuesta básica del inbox |

---

## 11. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Meta restringe o revoca acceso a APIs de inbox | Media | Alto | Diseñar arquitectura webhook desacoplada, explorar WhatsApp Business como alternativa primaria |
| WhatsApp Terms 2026 limitan uso de IA | Alta | Medio | Posicionar IA como "incidental" (asistencia a humanos), no como bot autónomo |
| Sobrepromesa técnica en voice cloning | Media | Alto | Solo activar con consentimiento explícito, comunicar limitaciones, tener ElevenLabs como proveedor externo |
| Confusión de nombre con "Mochi" (competidor) | Baja | Bajo | Kalo Ops es nombre propio y diferenciado |
| Alta churn por complejidad de onboarding | Alta | Alto | Invertir en onboarding guiado, "quick wins" en primera semana, checklist de arranque |
| CAC alto sin virality | Media | Alto | Implementar programa de referidos desde Fase 5, content marketing demostrando el propio producto |

---

## 12. Dependencias Externas

| Dependencia | Tipo | Criticidad | Alternativa |
|---|---|---|---|
| Meta Graph API | API externa | Crítica (MVP) | N/A (bloqueante para MVP) |
| Supabase | Backend/DB | Crítica | Firebase o PlanetScale si hay issues |
| ElevenLabs | AI/TTS | Opcional (Fase 3) | PlayHT, Resemble AI |
| Google Gemini API | AI/LLM | Alta (Fase 3) | OpenAI GPT-4o |
| Stripe | Pagos | Alta (MVP) | LemonSqueezy para LATAM |
| Calendly | Integraciones | Media (MVP) | Cal.com (open source) |
| Vercel | Deploy | Media | Railway, Fly.io |

---

## 13. Criterios de Aceptación del MVP

Para que el MVP sea considerado "lanzable" deben cumplirse:

- [ ] Un equipo de hasta 3 setters puede operar el inbox de Instagram completo desde Kalo Ops
- [ ] Los mensajes aparecen en tiempo real (< 5 segundos)
- [ ] Los estados de lead se pueden cambiar y quedan registrados
- [ ] Los bookings de Calendly aparecen automáticamente como "Booked" en el estado
- [ ] Los pagos de Stripe cierran deals automáticamente como "Ganados"
- [ ] El founder recibe un resumen diario (email o Slack) con métricas básicas
- [ ] El pipeline Kanban muestra el embudo visual con valores en juego
- [ ] Al menos 3 clientes beta completaron una semana completa de operación sin incidentes críticos

---

## 14. Glosario

| Término | Definición |
|---|---|
| **Setter** | Miembro del equipo que hace el primer contacto con leads y los califica |
| **Closer** | Miembro que toma la llamada de cierre con leads ya calificados |
| **Away Mode** | Modo de respuesta automática activado cuando el equipo humano está offline |
| **Voice Clone** | Réplica sintética de la voz del founder generada por IA |
| **Attribution** | Proceso de vincular un lead/venta a la pieza de contenido que lo originó |
| **SLA** | Service Level Agreement: tiempo máximo aceptable de respuesta |
| **TTFR** | Time to First Response: tiempo desde DM recibido hasta primera respuesta |
| **Funnel Velocity** | Velocidad promedio en que un lead atraviesa todo el embudo comercial |
| **Deal** | Oportunidad de venta asociada a un lead específico en el pipeline |
| **Tenant** | Cliente de Kalo Ops (una organización) en la arquitectura multi-tenant |

---

*Documento generado: 2026-03-03 — Kalo Ops v1.0 PRD*  
*Próxima revisión: tras validación con primeros 3 clientes beta*
