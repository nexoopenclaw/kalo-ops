import { NextResponse } from "next/server";
import { voiceService, type CreateExperimentInput } from "@/lib/voice-service";

type CreateBody = Partial<CreateExperimentInput>;

export async function POST(request: Request) {
  let payload: CreateBody;

  try {
    payload = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !payload.organizationId ||
    !payload.actorUserId ||
    !payload.name?.trim() ||
    typeof payload.trafficSplitA !== "number" ||
    !payload.variantA?.openerTemplate?.trim() ||
    !payload.variantA?.followupTemplate?.trim() ||
    !payload.variantB?.openerTemplate?.trim() ||
    !payload.variantB?.followupTemplate?.trim()
  ) {
    return NextResponse.json(
      { ok: false, error: "organizationId, actorUserId, name, trafficSplitA y variantes A/B completas son obligatorios" },
      { status: 400 },
    );
  }

  if (payload.trafficSplitA < 5 || payload.trafficSplitA > 95) {
    return NextResponse.json({ ok: false, error: "trafficSplitA debe estar entre 5 y 95" }, { status: 400 });
  }

  const data = await voiceService.createExperiment({
    organizationId: payload.organizationId,
    actorUserId: payload.actorUserId,
    name: payload.name.trim(),
    trafficSplitA: payload.trafficSplitA,
    variantA: {
      openerTemplate: payload.variantA.openerTemplate.trim(),
      followupTemplate: payload.variantA.followupTemplate.trim(),
    },
    variantB: {
      openerTemplate: payload.variantB.openerTemplate.trim(),
      followupTemplate: payload.variantB.followupTemplate.trim(),
    },
  });

  return NextResponse.json({ ok: true, data }, { status: 201 });
}
