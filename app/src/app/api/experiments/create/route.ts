import { fail, ok } from "@/lib/api-response";
import { voiceService, type CreateExperimentInput } from "@/lib/voice-service";

type CreateBody = Partial<CreateExperimentInput>;

export async function POST(request: Request) {
  let payload: CreateBody;
  try {
    payload = (await request.json()) as CreateBody;
  } catch {
    return fail({ code: "INVALID_JSON", message: "Body JSON inválido." }, 400);
  }

  if (
    !payload.organizationId ||
    !payload.actorUserId ||
    !payload.name?.trim() ||
    !payload.goal?.trim() ||
    !payload.channel ||
    typeof payload.trafficSplitA !== "number" ||
    !payload.variantA?.name?.trim() ||
    !payload.variantA?.openerTemplate?.trim() ||
    !payload.variantA?.followupTemplate?.trim() ||
    !payload.variantB?.name?.trim() ||
    !payload.variantB?.openerTemplate?.trim() ||
    !payload.variantB?.followupTemplate?.trim()
  ) {
    return fail({ code: "VALIDATION_ERROR", message: "Completa todos los campos del wizard para crear el experimento." }, 400);
  }

  if (payload.trafficSplitA < 5 || payload.trafficSplitA > 95) {
    return fail({ code: "VALIDATION_ERROR", message: "trafficSplitA debe estar entre 5 y 95." }, 400);
  }

  const data = await voiceService.createExperiment({
    organizationId: payload.organizationId,
    actorUserId: payload.actorUserId,
    name: payload.name.trim(),
    goal: payload.goal.trim(),
    channel: payload.channel,
    trafficSplitA: payload.trafficSplitA,
    variantA: {
      name: payload.variantA.name.trim(),
      openerTemplate: payload.variantA.openerTemplate.trim(),
      followupTemplate: payload.variantA.followupTemplate.trim(),
    },
    variantB: {
      name: payload.variantB.name.trim(),
      openerTemplate: payload.variantB.openerTemplate.trim(),
      followupTemplate: payload.variantB.followupTemplate.trim(),
    },
  });

  return ok(data, 201);
}
