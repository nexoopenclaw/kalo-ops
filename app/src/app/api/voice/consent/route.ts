import { fail, ok } from "@/lib/api-response";
import { voiceService, type VoiceConsentInput } from "@/lib/voice-service";

type ConsentBody = Partial<VoiceConsentInput>;

export async function POST(request: Request) {
  let payload: ConsentBody;
  try {
    payload = (await request.json()) as ConsentBody;
  } catch {
    return fail({ code: "INVALID_JSON", message: "Body JSON inválido." }, 400);
  }

  if (!payload.organizationId || !payload.actorUserId || !payload.leadId || typeof payload.voiceCloneAllowed !== "boolean") {
    return fail(
      { code: "VALIDATION_ERROR", message: "organizationId, actorUserId, leadId y voiceCloneAllowed son obligatorios." },
      400,
    );
  }

  const data = await voiceService.setConsent({
    organizationId: payload.organizationId,
    actorUserId: payload.actorUserId,
    leadId: payload.leadId,
    voiceCloneAllowed: payload.voiceCloneAllowed,
    reason: payload.reason?.trim(),
  });

  return ok(data, 202);
}
