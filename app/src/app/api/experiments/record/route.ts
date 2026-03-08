import { NextResponse } from "next/server";
import { voiceService, type RecordOutcomeInput } from "@/lib/voice-service";

type RecordBody = Partial<RecordOutcomeInput>;
const allowedEvents: RecordOutcomeInput["eventType"][] = ["impression", "reply", "conversion"];

export async function POST(request: Request) {
  let payload: RecordBody;

  try {
    payload = (await request.json()) as RecordBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.organizationId || !payload.experimentId || !payload.variant || !payload.eventType) {
    return NextResponse.json({ ok: false, error: "organizationId, experimentId, variant y eventType son obligatorios" }, { status: 400 });
  }

  if (payload.variant !== "A" && payload.variant !== "B") {
    return NextResponse.json({ ok: false, error: "variant debe ser A o B" }, { status: 400 });
  }

  if (!allowedEvents.includes(payload.eventType)) {
    return NextResponse.json({ ok: false, error: "eventType inválido" }, { status: 400 });
  }

  await voiceService.recordOutcome({
    organizationId: payload.organizationId,
    experimentId: payload.experimentId,
    variant: payload.variant,
    eventType: payload.eventType,
    weight: payload.weight,
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}
