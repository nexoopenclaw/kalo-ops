# Sprint 14 · Hoy Cockpit Unificado

## Objetivo
Construir la página **/hoy** como cockpit operacional único para iniciar el día con foco de ejecución: prioridades, SLA, riesgo comercial, estado de automatizaciones/experimentos y alertas accionables.

## Entregables implementados
1. **Ruta /hoy en navegación principal** y redirect raíz hacia `/hoy` para priorizar command center diario.
2. **UI command-center** en `src/components/hoy/hoy-workspace.tsx` con 5 bloques:
   - Prioridades de hoy
   - Inbox SLA urgente
   - Deals en riesgo
   - Estado rápido de automatizaciones + experimentos
   - Top alertas + quick actions
3. **Servicio agregador** `src/lib/hoy-service.ts`:
   - Consume `inboxService`, `crmService`, `automationService`, `healthService`, `webhook-engine`, `attributionService`
   - Usa estado de experimentos desde `in-memory-persistence`
   - Devuelve payload unificado `HoySummary`
4. **API** `GET /api/hoy/summary` para snapshot unificado usado por UI (SSR inicial + refresh cliente).
5. **QA** actualizado en `/qa` con checklist y smoke tests orientados al cockpit unificado.

## Notas de arquitectura
- Se mantiene enfoque **in-memory mock-first** coherente con el resto del proyecto.
- `hoyService` centraliza lógica de priorización para no duplicarla entre UI/API.
- `ensureWebhookSeed()` garantiza métricas útiles para panel de alertas incluso en entornos limpios.

## Criterios de aceptación (cumplidos)
- [x] Copy operativo en español.
- [x] Estética premium dark + acento `#d4e83a`.
- [x] Cockpit usable como home operacional diaria.
- [x] Endpoint API estable para futura integración mobile/TV wall.
