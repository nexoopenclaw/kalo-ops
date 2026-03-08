# Sprint 5 · Automation Engine Scaffold (Credential-free)

## Objetivo
Construir el primer esqueleto de un motor de automatizaciones no-code en Kalo Ops sin credenciales productivas (Meta/Supabase), listo para conectar en Sprint siguiente.

## Scope entregado
1. Página `/automations` con builder mock:
   - Cards: **Trigger → Conditions → Actions**.
   - Lista de workflows con:
     - toggle activo/inactivo
     - execution count
     - last run
   - Drawer modal para crear/editar definición (estado local).
2. `src/lib/automation-service.ts`:
   - modelos tipados
   - repositorio in-memory
   - métodos: `list`, `create`, `update`, `toggle`, `simulateRun`, `listExecutionLogs`
3. API scaffold:
   - `POST /api/automations/create`
   - `POST /api/automations/toggle`
   - `POST /api/automations/simulate`
   - validaciones + TODOs para persistencia/ejecución real
4. Extensión SQL en `db/schema.sql`:
   - `public.automations`
   - `public.automation_logs`
   - índices
   - stubs de políticas RLS

## Fórmulas operativas
- **Execution success rate (%)**
  - `success_runs / total_runs * 100`
- **Automation coverage (%)**
  - `active_workflows / total_workflows * 100`
- **Avg run latency (ms)**
  - `avg(finished_at - started_at)`
- **Assisted reply rate (%)** (cuando se conecte con inbox)
  - `threads_touched_by_automation / total_threads * 100`

## Testing manual rápido
1. Levantar app (`npm run dev`) y abrir `/automations`.
2. Crear workflow desde drawer.
3. Editar workflow existente y guardar.
4. Alternar estado activo/inactivo desde la lista.
5. Probar APIs con cURL:

```bash
curl -X POST http://localhost:3000/api/automations/create \
  -H 'Content-Type: application/json' \
  -d '{
    "organizationId":"org_1",
    "name":"Keyword warm lead",
    "trigger":{"type":"keyword","value":"precio"},
    "actions":[{"type":"notify","value":"Lead preguntó precio"}]
  }'

curl -X POST http://localhost:3000/api/automations/toggle \
  -H 'Content-Type: application/json' \
  -d '{"organizationId":"org_1","workflowId":"wf_1","active":false}'

curl -X POST http://localhost:3000/api/automations/simulate \
  -H 'Content-Type: application/json' \
  -d '{"organizationId":"org_1","workflowId":"wf_1","context":{"conversationId":"conv_1"}}'
```

## Próximos requisitos de credenciales (Sprint siguiente)
1. **Supabase**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - (backend seguro) `SUPABASE_SERVICE_ROLE_KEY`
2. **Meta Graph / WhatsApp / Instagram**
   - `META_ACCESS_TOKEN`
   - `META_PHONE_NUMBER_ID` (WhatsApp)
   - `META_IG_BUSINESS_ID` / `META_PAGE_ID` según canal
   - webhook verify token + app secret
3. **Queue/Workers** (recomendado)
   - Redis/Upstash o cola gestionada para ejecución asíncrona
4. **Observabilidad**
   - Sentry/Logtail/DataDog para fallos y latencia por acción

## Notas
- Esta entrega es intencionalmente **credential-free**.
- Las rutas API ya incluyen comentarios TODO para conectar persistencia real y ejecución Meta sin romper la interfaz actual.
