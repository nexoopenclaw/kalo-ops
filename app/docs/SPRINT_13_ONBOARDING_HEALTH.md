# Sprint 13 · Onboarding + Customer Health + Retention Ops

## Objetivo del bloque
Acelerar activación inicial y crear visibilidad de salud del portfolio para ejecutar retención proactiva en cuentas con mayor riesgo.

---

## Alcance implementado

### 1) Onboarding workspace (`/onboarding`)
- Checklist guiado con 5 hitos:
  - conectar canal
  - crear primer pipeline
  - importar leads
  - activar primera automatización
  - configurar alertas
- Tracker de progreso en porcentaje.
- ETA de minutos restantes.
- Recomendaciones quick-start dinámicas según tareas pendientes.
- Persistencia in-memory compartida por organización usando `onboarding-service`.

### 2) Customer Health (`/health`)
- Cards de salud de portfolio:
  - adoption score
  - activity score
  - conversion trend
  - risk level (green/yellow/red)
- Tabla de cuentas mock multi-tenant con estado de riesgo y razones.
- Drilldown lateral por cuenta con:
  - razones de riesgo
  - acciones sugeridas
  - registro de acción de retención vía API.

### 3) Servicios y API
- Nuevo `src/lib/onboarding-service.ts` con patrón typed repository.
- Nuevo `src/lib/health-service.ts` con patrón typed repository.
- Endpoints nuevos con schema consistente `{ ok, data, meta }` / `{ ok, error }`:
  - `GET /api/onboarding/state`
  - `POST /api/onboarding/check`
  - `GET /api/health/summary`
  - `GET /api/health/orgs`
  - `POST /api/health/action`

### 4) Schema SQL (scaffold)
Se extiende `db/schema.sql` con:
- `onboarding_states`
- `customer_health_snapshots`
- `health_actions_log`
- índices por `organization_id` y campos operativos.
- stubs/comentarios RLS por `organization_id`.

---

## Acceptance Criteria

- [x] Existe ruta `/onboarding` con checklist de 5 tareas, progreso y ETA.
- [x] Estado de onboarding se conserva en repositorio in-memory compartido.
- [x] Existe ruta `/health` con cards de score y riesgo global.
- [x] Tabla de cuentas con razones de riesgo visibles.
- [x] Drilldown por cuenta con acciones sugeridas.
- [x] Se puede registrar acción de retención vía API.
- [x] APIs nuevas responden con esquema consistente.
- [x] SQL contiene nuevas tablas + índices + stubs de políticas.
- [x] QA page actualizada con checks del Sprint 13.

---

## Manual QA Matrix

| Caso | Ruta/API | Resultado esperado |
|---|---|---|
| Render onboarding | `/onboarding` | Se muestran 5 tareas, progreso inicial y recomendaciones |
| Toggle tarea | `POST /api/onboarding/check` | Cambia estado de tarea y recalcula porcentaje/ETA |
| Leer estado onboarding | `GET /api/onboarding/state` | Retorna `{ ok: true, data: { state, tasks, progress } }` |
| Render health | `/health` | Se muestran cards + tabla de cuentas con riesgo |
| Drilldown org | `/health` | Al seleccionar fila aparecen razones y acciones sugeridas |
| Log de acción | `POST /api/health/action` | Devuelve 201 con `data.id` y `createdAt` |
| Summary portfolio | `GET /api/health/summary` | Retorna score agregado y risk level global |
| Listado orgs | `GET /api/health/orgs` | Retorna lista ordenada por riesgo/actividad |
| Error validación | APIs nuevas | Devuelven `{ ok: false, error: { code, message } }` |

---

## Notas de evolución
- Próximo paso: persistir onboarding/health en Supabase con RLS activo por membresía.
- Añadir paginación/filtros en `/health` para portfolios grandes.
- Programar snapshots diarios de health para tendencia semanal real.
