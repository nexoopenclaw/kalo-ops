import { NextResponse } from "next/server";
import { voiceService, type VoicePreviewInput } from "@/lib/voice-service";

type PreviewBody = Partial<VoicePreviewInput>;

export async function POST(request: Request) {
  let payload: PreviewBody;

  try {
    payload = (await request.json()) as PreviewBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.organizationId || !payload.actorUserId || !payload.voiceModelId || !payload.sourceText?.trim()) {
    return NextResponse.json(
      { ok: false, error: "organizationId, actorUserId, voiceModelId y sourceText son obligatorios" },
      { status: 400 },
    );
  }

  const data = await voiceService.generatePreview({
    organizationId: payload.organizationId,
    actorUserId: payload.actorUserId,
    voiceModelId: payload.voiceModelId,
    sourceText: payload.sourceText.trim(),
  });

  // TODO(ElevenLabs): replace mock preview with provider call and fallback strategy.
  return NextResponse.json({ ok: true, data }, { status: 202 });
}
