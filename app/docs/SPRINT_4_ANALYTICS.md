# Sprint 4/5 · Revenue & Analytics (credential-free)

## Scope shipped
- CRM dashboard metrics cards:
  - Booking Rate
  - Show-up Rate
  - Closing Rate
  - Funnel Velocity (days)
  - Revenue en juego
- Panels:
  - Top objeciones
  - Deals en riesgo (sin actividad > N días, mock default N=5)
  - Revenue por etapa
- Pipeline enhancements:
  - Filters/search: owner, stage, query, date range
  - Stage movement history timeline in deal drawer
- Service/API:
  - `crmService.getFunnelSummary(organizationId, atRiskDays)`
  - `crmService.listDeals(organizationId, filters)`
  - `crmService.listDealStageHistory(...)`
  - `GET /api/analytics/funnel-summary`

## Formulas
- **Booking Rate** = deals en `{booked, show, won}` / total deals * 100
- **Show-up Rate** = deals en `{show, won}` / deals en `{booked, show, won}` * 100
- **Closing Rate** = deals en `{won}` / deals en `{show, won}` * 100
- **Funnel Velocity (days)** = promedio de días desde `createdAt` hasta primer hito relevante (`wonAt`/`lostAt`/`showAt`/`bookedAt`)
- **Revenue en juego** = suma de `value` de deals que no están en `won` ni `lost`
- **Deals en riesgo** = `days(now - lastActivityAt) > atRiskDays` y etapa distinta de `won/lost`

## API contract
### `GET /api/analytics/funnel-summary`
Query params (optional unless indicated):
- `organizationId` (default `org_1`)
- `atRiskDays` (1..90, default `5`)
- `ownerId`
- `stage` in `new|qualified|booked|show|won|lost`
- `query` (lead/email/owner)
- `fromDate` (ISO date)
- `toDate` (ISO date)

Response:
```json
{
  "ok": true,
  "data": {
    "totalDeals": 4,
    "bookingRate": 50,
    "showUpRate": 50,
    "closingRate": 0,
    "funnelVelocityDays": 8.5,
    "revenueInPlayTotal": 29800,
    "revenueByStage": [{ "stage": "qualified", "label": "Calificado", "totalValue": 4800, "deals": 1 }],
    "topObjections": [{ "label": "Duda sobre tiempo de implementación.", "count": 1 }],
    "dealsAtRisk": [{ "dealId": "deal_4", "leadName": "Carlos León", "inactiveDays": 6 }]
  },
  "deals": []
}
```

## Credential-free validation steps
1. `npm run build`
2. `npm run dev`
3. Open `/crm`
4. Validate metric cards render and values update after stage changes.
5. Use filter controls:
   - choose owner + stage
   - set date range
   - run free text search
6. Open any deal drawer and confirm timeline events are visible.
7. Test API directly:
   - `/api/analytics/funnel-summary`
   - `/api/analytics/funnel-summary?stage=booked&ownerId=set_1`
   - `/api/analytics/funnel-summary?atRiskDays=3`

## Supabase blockers (credentials required)
- Wiring repository to real `public.deals`, `public.deal_stage_history`, `public.deal_objections`
- Auth-aware `organizationId` resolution from session/JWT
- RLS policy activation and end-to-end validation with real users
