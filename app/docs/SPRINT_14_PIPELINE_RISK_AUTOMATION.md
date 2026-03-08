# Sprint 14 · Pipeline Risk Automation + Alerting Workflows

## Objetivo
Convertir la detección de deals en riesgo en una rutina operativa diaria con automatizaciones accionables para recuperar revenue en juego.

## Alcance implementado

### 1) Command center "Hoy" (`/hoy`)
- Cockpit con KPIs críticos:
  - deals en riesgo
  - revenue en riesgo
  - reglas activas
  - acciones sugeridas
- Tabla de deals críticos y panel de recomendaciones operativas.
- Módulo de workflows de rescate con toggle activo/inactivo.
- Feed de alertas recientes generadas por escaneo.

### 2) Motor de riesgo (`src/lib/risk-automation-service.ts`)
- Consume CRM (`crmService.getFunnelSummary`) para detectar deals inactivos.
- Cruza reglas de alertas (`attributionService.listAlertRules`) para contexto operativo.
- Ejecuta escaneo bajo demanda y genera alertas en memoria.
- Marca workflows disparados y simula ejecución en automation engine existente.

### 3) APIs nuevas
- `GET /api/risk/cockpit` → snapshot del command center.
- `POST /api/risk/scan` → ejecuta scan de riesgo y devuelve métricas de disparo.
- `POST /api/risk/workflows/toggle` → activa/pausa workflows de rescate.

### 4) Navegación + UX
- Nuevo item lateral: **Hoy**.
- Header actualizado a Sprint 14.
- UI dark premium consistente con acento `#d4e83a`.

### 5) Schema SQL (scaffold)
- `risk_alert_events`
- `risk_workflow_states`
- Índices por organización/severidad/estado y stubs RLS.

## Acceptance Criteria

- [x] Existe ruta `/hoy` con visión operativa de riesgo de pipeline.
- [x] Se puede ejecutar scan manual de riesgo desde UI y API.
- [x] Se generan alertas de riesgo consumibles por cockpit.
- [x] Workflows de rescate se pueden activar/pausar.
- [x] El motor de riesgo está enlazado a CRM + alert rules + automations.
- [x] QA actualizado para Sprint 14.
- [x] Schema SQL extendido para persistencia futura.

## Próximo paso recomendado
- Programar escaneo horario por cron y persistir alertas/workflows en Supabase para trazabilidad multiusuario.
