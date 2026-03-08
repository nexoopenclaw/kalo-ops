import { fail, ok } from "@/lib/api-response";
import { voiceService, type VoicePreviewInput } from "@/lib/voice-service";

type PreviewBody = Partial<VoicePreviewInput>;

export async function POST(request: Request) {
  let payload: PreviewBody;

  try {
    payload = (await request.json()) as PreviewBody;
  } catch {
    return fail({ code: "INVALID_JSON", message: "Body JSON inválido." }, 400);
  }

  if (!payload.organizationId || !payload.actorUserId || !payload.voiceModelId || !payload.leadId || !payload.sourceText?.trim()) {
    return fail(
      { code: "VALIDATION_ERROR", message: "organizationId, actorUserId, leadId, voiceModelId y sourceText son obligatorios." },
      400,
    );
  }

  const data = await voiceService.generatePreview({
    organizationId: payload.organizationId,
    actorUserId: payload.actorUserId,
    leadId: payload.leadId,
    voiceModelId: payload.voiceModelId,
    sourceText: payload.sourceText.trim(),
  });

  return ok(data, 202);
}
