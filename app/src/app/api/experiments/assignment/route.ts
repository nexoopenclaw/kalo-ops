import { fail, ok } from "@/lib/api-response";
import { voiceService } from "@/lib/voice-service";

type AssignmentBody = {
  organizationId?: string;
  experimentId?: string;
  leadKey?: string;
};

export async function POST(request: Request) {
  let payload: AssignmentBody;
  try {
    payload = (await request.json()) as AssignmentBody;
  } catch {
    return fail({ code: "INVALID_JSON", message: "Body JSON inválido." }, 400);
  }

  if (!payload.organizationId || !payload.experimentId || !payload.leadKey?.trim()) {
    return fail({ code: "VALIDATION_ERROR", message: "organizationId, experimentId y leadKey son obligatorios." }, 400);
  }

  const data = await voiceService.assignVariant({
    organizationId: payload.organizationId,
    experimentId: payload.experimentId,
    leadKey: payload.leadKey.trim(),
  });

  if (!data) {
    return fail({ code: "NOT_FOUND", message: "Experimento no encontrado." }, 404);
  }

  return ok(data);
}
