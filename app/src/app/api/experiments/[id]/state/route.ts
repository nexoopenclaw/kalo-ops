import { fail, ok } from "@/lib/api-response";
import { voiceService } from "@/lib/voice-service";
import type { ExperimentState } from "@/lib/in-memory-persistence";

type TransitionBody = { organizationId?: string; nextState?: ExperimentState };

const allowedStates: ExperimentState[] = ["draft", "running", "paused", "completed"];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  let payload: TransitionBody;

  try {
    payload = (await request.json()) as TransitionBody;
  } catch {
    return fail({ code: "INVALID_JSON", message: "Body JSON inválido." }, 400);
  }

  const { id } = await context.params;
  if (!id || !payload.organizationId || !payload.nextState || !allowedStates.includes(payload.nextState)) {
    return fail({ code: "VALIDATION_ERROR", message: "id, organizationId y nextState válidos son obligatorios." }, 400);
  }

  const data = await voiceService.transitionExperimentState(payload.organizationId, id, payload.nextState);
  if (!data) return fail({ code: "NOT_FOUND", message: "Experimento no encontrado." }, 404);

  return ok(data);
}
