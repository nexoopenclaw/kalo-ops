import { fail, ok } from "@/lib/api-response";
import { voiceService, type RecordOutcomeInput } from "@/lib/voice-service";

type RecordBody = Partial<RecordOutcomeInput>;
const allowedEvents: RecordOutcomeInput["eventType"][] = ["impression", "reply", "conversion"];

export async function POST(request: Request) {
  let payload: RecordBody;

  try {
    payload = (await request.json()) as RecordBody;
  } catch {
    return fail({ code: "INVALID_JSON", message: "Body JSON inválido." }, 400);
  }

  if (!payload.organizationId || !payload.experimentId || !payload.variant || !payload.eventType) {
    return fail({ code: "VALIDATION_ERROR", message: "organizationId, experimentId, variant y eventType son obligatorios." }, 400);
  }

  if (payload.variant !== "A" && payload.variant !== "B") {
    return fail({ code: "VALIDATION_ERROR", message: "variant debe ser A o B." }, 400);
  }

  if (!allowedEvents.includes(payload.eventType)) {
    return fail({ code: "VALIDATION_ERROR", message: "eventType inválido." }, 400);
  }

  const result = await voiceService.recordOutcome({
    organizationId: payload.organizationId,
    experimentId: payload.experimentId,
    variant: payload.variant,
    eventType: payload.eventType,
    weight: payload.weight,
  });

  if (result.blocked) {
    const status = result.reason === "EXPERIMENT_NOT_FOUND" ? 404 : 409;
    return fail({ code: result.reason ?? "BLOCKED", message: "No se pudo registrar outcome por estado del experimento." }, status);
  }

  return ok({ recorded: true }, 202);
}
