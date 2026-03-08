# Sprint 8 · Voice Notes + A/B Testing (Scaffold)

## Scope delivered
- Voice Notes UI (`/voice-lab`):
  - consent gate toggle for voice cloning usage
  - text → preview script → mock generation state
  - mock send voice note action
  - audit log table (timestamp, source hash preview, voice model id, actor)
- A/B testing UI:
  - create A/B opener + follow-up variants
  - assign mock traffic and record outcomes
  - stats display: reply rate + conversion proxy
  - winner badge with simple significance heuristic
- Service layer:
  - `src/lib/voice-service.ts` with typed models + repository pattern
  - methods: `setConsent`, `generatePreview`, `sendVoiceNote`, `listVoiceAuditLogs`, `createExperiment`, `recordOutcome`, `computeWinner`, `getExperimentResults`
- API scaffolding:
  - `POST /api/voice/consent`
  - `POST /api/voice/preview`
  - `POST /api/voice/send`
  - `POST /api/experiments/create`
  - `POST /api/experiments/record`
  - `GET /api/experiments/:id/results`

## Setup notes
1. Install deps and run app:
   - `npm install`
   - `npm run dev`
2. Open `/voice-lab`.
3. This sprint is credential-free (in-memory mock repo).

## Safety & compliance notes
- Consent is captured before voice clone actions.
- Voice payload traces are reduced to SHA-256 hash previews in UI to avoid plain-text replay in logs.
- API routes include basic validation and TODO hooks for:
  - ElevenLabs integration
  - persistent storage in Supabase
  - delivery status reconciliation for outbound audio
- Recommended for production:
  - signed evidence of consent (IP/user-agent/timestamp)
  - retention policies for audio and prompts
  - opt-out enforcement and legal basis by region

## Manual QA checklist
- [ ] Toggle consent ON/OFF and verify POST `/api/voice/consent` returns `ok: true`.
- [ ] Generate preview only when consent is ON.
- [ ] Verify preview shows hash snippet + model id.
- [ ] Send voice note and confirm new row appears in audit table.
- [ ] Create A/B experiment with both variants and traffic split.
- [ ] Seed mock traffic and outcomes.
- [ ] Load results and verify stats render for variants A/B.
- [ ] Confirm winner badge is shown only when heuristic reaches a conclusive result.
- [ ] Run `npm run build` successfully.
