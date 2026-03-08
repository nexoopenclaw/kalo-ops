import { NextResponse } from "next/server";
import { voiceService, type SendVoiceNoteInput } from "@/lib/voice-service";

type SendBody = Partial<SendVoiceNoteInput>;

export async function POST(request: Request) {
  let payload: SendBody;

  try {
    payload = (await request.json()) as SendBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.organizationId || !payload.actorUserId || !payload.leadId || !payload.voiceModelId || !payload.sourceText?.trim()) {
    return NextResponse.json(
      { ok: false, error: "organizationId, actorUserId, leadId, voiceModelId y sourceText son obligatorios" },
      { status: 400 },
    );
  }

  const data = await voiceService.sendVoiceNote({
    organizationId: payload.organizationId,
    actorUserId: payload.actorUserId,
    leadId: payload.leadId,
    conversationId: payload.conversationId,
    voiceModelId: payload.voiceModelId,
    sourceText: payload.sourceText.trim(),
    previewId: payload.previewId,
  });

  // TODO(Persistence): store provider message id and delivery status reconciliation.
  return NextResponse.json({ ok: true, data }, { status: 202 });
}
