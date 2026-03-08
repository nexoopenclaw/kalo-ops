# Sprint 6/7 · AI Copilot Core (Credential-free)

## Scope delivered
- New `/copilot` page integrated in app shell navigation.
- Mock AI Copilot UX modules:
  - Contextual reply suggestions (conversation/deal aware)
  - Objection classifier (`precio`, `timing`, `confianza`, `urgencia`, `competencia`, `otro`)
  - Conversation summary generator
  - Conversation quality scorecard (`claridad`, `empatía`, `CTA`, `manejo objeción`)
- Service layer with repository pattern in `src/lib/copilot-service.ts`.
- API scaffolding routes:
  - `POST /api/copilot/suggest`
  - `POST /api/copilot/classify`
  - `POST /api/copilot/summarize`
  - `POST /api/copilot/score`
- Schema extension with AI audit support:
  - `public.ai_interactions`
  - `public.ai_interaction_events`

## Test flow (manual)
1. Run app locally and open `/copilot`.
2. Change active context (lead/channel/deal selector).
3. Click **Generar** in “Sugerencias de respuesta” and confirm cards render with confidence.
4. Edit objection text and click **Clasificar**; verify category and confidence appears.
5. Click **Generar** in “Resumen conversacional”; verify summary, next action, and risks list.
6. Click **Evaluar** in “Scorecard de calidad”; verify all rubric metrics and overall score render.
7. Open DevTools Network and confirm all requests return `{ ok: true, data: ... }`.

## API contract checks
- Routes reject invalid JSON with `400` and `{ ok: false, error }`.
- Required fields validated:
  - `context.organizationId` for all endpoints
  - `conversation[]` for suggest/summarize/score
  - `message` for classify
- Responses are structured and ready for UI consumption.

## Acceptance criteria
- `/copilot` visible from shell nav and functional in dark premium style.
- All four copilot cards work end-to-end against mock API/service.
- Service layer is typed, repository-based, and provider-agnostic.
- SQL schema includes auditable AI interaction logging without storing raw secrets.
- Build passes (`npm run build`).

## Required credentials for real AI integration (later)
- `OPENAI_API_KEY` or `GEMINI_API_KEY`
- Optional model config:
  - `AI_PROVIDER=openai|gemini`
  - `AI_MODEL=<provider-model-name>`
- Optional observability:
  - `AI_LOG_LEVEL=info|debug`
  - `AI_TIMEOUT_MS=15000`

> Security note: never persist raw API keys, auth tokens, or sensitive prompt content in `ai_interactions` metadata.
