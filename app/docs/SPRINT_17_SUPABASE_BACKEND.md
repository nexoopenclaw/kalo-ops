# Sprint 17 · Supabase Backend Foundation

## Scope delivered
- Multi-tenant SQL migration with full core operational tables.
- RLS baseline with role-aware org scoping (owner/admin/setter/closer).
- Auth + organization context resolver for API routes.
- Supabase repositories replacing in-memory paths for prioritized APIs.
- Bootstrap scripts + runbook docs.

## Acceptance criteria
- [x] Tables exist for organizations/profiles/memberships/leads/conversations/messages/deals/deal_stage_history/automations/automation_executions/automation_queue/webhook_events/dead_letter_events/content_pieces/content_attributions/alert_configs/reports_snapshots.
- [x] PK/FK/unique constraints + practical indexes added.
- [x] RLS deny-by-default via explicit role/member policies.
- [x] APIs migrated:
  - [x] `/api/leads/list`
  - [x] `/api/leads/create`
  - [x] `/api/deals/update-stage`
  - [x] `/api/deals/upsert-note`
  - [x] `/api/automations/create`
  - [x] `/api/automations/toggle`
  - [x] `/api/automations/execute`
  - [x] `/api/webhooks/process`
  - [x] `/api/webhooks/events`
- [x] Response shape preserved as `{ ok, data | error }`.
- [x] Build passes locally (`npm run build`).

## Notes
- `SUPABASE_SERVICE_ROLE_KEY` is used only in server-side context resolution; browser client remains anon-only.
- Organization fallback works when user belongs to exactly one org; multi-org requires `x-org-id`.
