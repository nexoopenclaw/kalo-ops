import { fail, ok } from "@/lib/api-response";
import { voiceService } from "@/lib/voice-service";

type RevokeBody = {
  organizationId?: string;
  actorUserId?: string;
  leadId?: string;
  reason?: string;
};

export async function POST(request: Request) {
  let payload: RevokeBody;
  try {
    payload = (await request.json()) as RevokeBody;
  } catch {
    return fail({ code: "INVALID_JSON", message: "Body JSON inválido." }, 400);
  }

  if (!payload.organizationId || !payload.actorUserId || !payload.leadId) {
    return fail({ code: "VALIDATION_ERROR", message: "organizationId, actorUserId y leadId son obligatorios." }, 400);
  }

  const data = await voiceService.revokeConsent({
    organizationId: payload.organizationId,
    actorUserId: payload.actorUserId,
    leadId: payload.leadId,
    reason: payload.reason,
  });

  return ok(data, 202);
}
