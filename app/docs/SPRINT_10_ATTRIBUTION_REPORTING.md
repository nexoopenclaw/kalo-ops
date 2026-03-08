# Sprint 10 · Phase 4 Foundation (Content Attribution + Reporting)

## Objetivo PRD
Construir la base operativa para atribución de contenido y reportes ejecutivos con:
- módulo `/attribution` funcional (no placeholder),
- APIs de atribución,
- módulo `/reportes` funcional,
- APIs de reporting,
- extensión de schema SQL para persistencia futura en Supabase.

## Entregables implementados

### 1) Content Attribution module
- Ruta `/attribution` convertida en módulo real.
- Librería de contenido (mock-realista): plataforma, tipo, hook, ángulo, fecha publicación.
- Métricas por pieza: leads generados, calls booked, deals won, revenue atribuido.
- Panel de ranking de top hooks/angles.
- Vista `$/pieza` con tabla sortable (fecha, plataforma, métricas, revenue, ROI por pieza).
- UI mantenida en dark premium con acento `#d4e83a`.

### 2) Attribution service + APIs
- Nuevo servicio: `src/lib/attribution-service.ts`
  - Interfaces tipadas.
  - Patrón repositorio.
  - Persistencia in-memory compartida vía `src/lib/in-memory-persistence.ts`.
- Endpoints:
  - `GET /api/attribution/content`
  - `GET /api/attribution/summary`
  - `POST /api/attribution/link-lead`
- Validación implementada en POST con respuestas uniformes `ok/fail` usando helper `api-response`.

### 3) Reporting foundation
- Ruta `/reportes` con:
  - Daily Digest preview card.
  - Weekly Review preview card.
  - Alert rules panel (VIP no response, show-up drop, inbound spike, backlog).
  - Botones de export mock PDF/CSV.
- APIs:
  - `GET /api/reports/daily-preview`
  - `GET /api/reports/weekly-preview`
  - `POST /api/reports/alerts/upsert`

### 4) Schema extension
Actualizado `db/schema.sql` con tablas e índices (if-not-exists style):
- `content_pieces`
- `content_attributions`
- `reports_snapshots`
- `alert_configs`

Incluye:
- índices por organization scope,
- habilitación de RLS,
- stubs/comentarios de políticas org-scoped.

## Acceptance Criteria (mapeo PRD)
- [x] `/attribution` deja de ser placeholder y muestra métricas accionables.
- [x] Ranking de hooks/angles visible.
- [x] Vista `$/pieza` presente y sortable.
- [x] Servicio de atribución con interfaces tipadas y patrón repositorio.
- [x] APIs de attribution implementadas + validación + esquema respuesta consistente.
- [x] `/reportes` muestra digest/review/alertas/exports.
- [x] APIs de reporting implementadas.
- [x] SQL extendido con tablas, índices y RLS stubs para org scope.

## QA manual sugerido
1. Abrir `/attribution` y comprobar cards + ranking + tabla sortable.
2. Ejecutar `GET /api/attribution/content` y `GET /api/attribution/summary`.
3. Ejecutar `POST /api/attribution/link-lead` válido e inválido.
4. Abrir `/reportes` y validar Daily/Weekly/Alert rules/Exports.
5. Ejecutar `GET /api/reports/daily-preview`, `GET /api/reports/weekly-preview`.
6. Ejecutar `POST /api/reports/alerts/upsert` con `ruleType` válido e inválido.
7. Verificar build local `npm run build` en `app/`.
