# Sprint 8 Acceptance Checklist (PRD)

## 1) A/B Experiments end-to-end

- [ ] **Wizard de creación** (goal, channel, variantes, split)
  - **Pass:** POST `/api/experiments/create` devuelve `201` con `state=draft`.
  - **Fail:** falta cualquier campo o split fuera de rango.
- [ ] **Assignment determinístico**
  - **Pass:** mismo `experimentId + leadKey` retorna misma variante en `/api/experiments/assignment`.
  - **Fail:** variante cambia sin modificar leadKey.
- [ ] **Recording outcomes**
  - **Pass:** `/api/experiments/record` acepta eventos `impression|reply|conversion` cuando estado=`running`.
  - **Fail:** en draft/paused/completed debe bloquear con error.
- [ ] **Dashboard resultados**
  - **Pass:** `/api/experiments/[id]/results` devuelve ventana de tiempo, conversion por variante, lift %, confidence badge y winner state.
- [ ] **Lifecycle estados**
  - **Pass:** transición por `/api/experiments/[id]/state` entre `draft|running|paused|completed`.

## 2) Voice Notes hardening (sin credenciales)

- [ ] **Audit events preview/send**
  - **Pass:** preview genera `preview_generated`; envío exitoso genera `voice_sent`; fallo por consentimiento genera `voice_send_failed`.
- [ ] **Guardrails consentimiento explícito**
  - **Pass:** `/api/voice/send` requiere `consentConfirmed=true` + consentimiento vigente.
  - **Fail:** responde `403` + `CONSENT_REQUIRED`.
- [ ] **Compliance panel /voice-lab**
  - **Pass:** muestra estado, fecha último consentimiento y acción de revocación.

## 3) Backend y arquitectura de datos

- [ ] **Persistencia compartida in-memory**
  - **Pass:** voice + experiments usan `src/lib/in-memory-persistence.ts`.
- [ ] **Rutas nuevas/extensiones**
  - **Pass:** assignment, record outcome, lifecycle transition y consent revoke disponibles.
- [ ] **Schema consistente API**
  - **Pass:** respuestas `{ ok, data }` y errores `{ ok:false, error:{ code, message } }`.

## 4) QA interno

- [ ] **Página /qa** con estado por módulo + pasos de test manual.

## 5) UX

- [ ] **Dark premium + #d4e83a** consistente en paneles y CTAs.
- [ ] **Copy en español** en experiencia Sprint 8.
