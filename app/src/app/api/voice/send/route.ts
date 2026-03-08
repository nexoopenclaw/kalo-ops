import { fail, ok } from "@/lib/api-response";
import { voiceService, type SendVoiceNoteInput } from "@/lib/voice-service";

type SendBody = Partial<SendVoiceNoteInput>;

export async function POST(request: Request) {
  let payload: SendBody;

  try {
    payload = (await request.json()) as SendBody;
  } catch {
    return fail({ code: "INVALID_JSON", message: "Body JSON inválido." }, 400);
  }

  if (!payload.organizationId || !payload.actorUserId || !payload.leadId || !payload.voiceModelId || !payload.sourceText?.trim()) {
    return fail(
      { code: "VALIDATION_ERROR", message: "organizationId, actorUserId, leadId, voiceModelId y sourceText son obligatorios." },
      400,
    );
  }

  if (payload.consentConfirmed !== true) {
    return fail({ code: "CONSENT_REQUIRED", message: "Debes confirmar consentimiento explícito antes de enviar." }, 403);
  }

  const data = await voiceService.sendVoiceNote({
    organizationId: payload.organizationId,
    actorUserId: payload.actorUserId,
    leadId: payload.leadId,
    conversationId: payload.conversationId,
    voiceModelId: payload.voiceModelId,
    sourceText: payload.sourceText.trim(),
    previewId: payload.previewId,
    consentConfirmed: payload.consentConfirmed,
  });

  if (data.eventType === "voice_send_failed") {
    return fail({ code: "CONSENT_REQUIRED", message: data.message }, 403);
  }

  return ok(data, 202);
}
