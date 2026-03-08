# Sprint 16 · Automation Executor + Queue Reliability

## Objetivo
Cerrar gap crítico del PRD: ejecución operativa de automatizaciones con trazabilidad, cola y reintentos en entorno mock/in-memory.

## Scope implementado
- `src/lib/automation-executor.ts`
  - Evalúa triggers y condiciones contra estado en memoria actual.
  - Ejecuta acciones modeladas: `send_message`, `change_status`, `assign_setter`, `notify`, `add_tag`.
  - Registra logs con `status`, `reason`, `durationMs`, timestamps y resultados por acción.
- `src/lib/automation-queue.ts`
  - Cola en memoria con estados `pending/running/failed/completed`.
  - Metadata de retry: `retryCount`, `maxRetries`, `nextRetryAt`, `lastError`.
- API nuevas:
  - `POST /api/automations/execute`
  - `POST /api/automations/queue/enqueue`
  - `POST /api/automations/queue/run-next`
  - `GET /api/automations/executions`
  - `GET /api/automations/queue/status`
- UI `/automations`
  - Sección **Execution Center** con métricas de cola, tabla de ejecuciones y formulario de trigger manual safe mock.
- `db/schema.sql`
  - Nuevas tablas `automation_executions` y `automation_queue` + índices + RLS stubs por `organization_id`.

## Criterios de aceptación
1. Trigger manual en `/automations` ejecuta workflows activos compatibles y genera logs visibles.
2. Cola permite encolar job, ejecutar `run-next` y reflejar cambios en métricas.
3. Si no hay workflow activo para trigger, el resultado se marca como `failed` (job) o vacío (execute API).
4. Logs incluyen razón y duración en ms por ejecución.
5. Build (`npm run build`) compila sin errores.

## Runbook QA rápido
1. Abrir `/automations` y validar bloque **Execution Center** (dark premium + acento `#d4e83a`).
2. Trigger manual:
   - Tipo: `silence`
   - Contexto: `{"conversationId":"conv_2","leadId":"lead_2","leadScore":72}`
   - Click **Ejecutar ahora**.
   - Confirmar aparición en tabla de ejecuciones.
3. Cola:
   - Click **Encolar + run-next**.
   - Confirmar incremento en `queue size` y transición de estado.
4. API smoke:
   - `GET /api/automations/queue/status?organizationId=org_1`
   - `GET /api/automations/executions?organizationId=org_1&limit=10`
5. Verificar que no se exponen secretos ni credenciales (solo mock payloads).

## Notas
- Implementación actual es in-memory y no persistente entre reinicios.
- Preparado para swap a Supabase persistente en siguiente sprint sin romper contrato API.
