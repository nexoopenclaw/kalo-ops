import { NextResponse } from "next/server";
import { automationService, type AutomationTriggerType, type AutomationActionType } from "@/lib/automation-service";

type CreateBody = {
  organizationId?: string;
  name?: string;
  description?: string;
  trigger?: {
    type?: AutomationTriggerType;
    value?: string;
    windowMinutes?: number;
  };
  actions?: Array<{
    type?: AutomationActionType;
    value?: string;
    channel?: "instagram" | "whatsapp" | "email" | "internal";
  }>;
  conditions?: Array<{ field?: string; operator?: "equals" | "contains" | "greater_than" | "less_than" | "exists"; value?: string }>;
};

const triggerTypes: AutomationTriggerType[] = ["silence", "keyword", "stage_change", "booking", "payment"];
const actionTypes: AutomationActionType[] = ["send_message", "change_status", "assign_setter", "notify", "add_tag"];

export async function POST(request: Request) {
  let payload: CreateBody;

  try {
    payload = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.organizationId || !payload.name?.trim() || !payload.trigger?.type || !Array.isArray(payload.actions) || payload.actions.length === 0) {
    return NextResponse.json({ ok: false, error: "organizationId, name, trigger y actions son obligatorios" }, { status: 400 });
  }

  if (!triggerTypes.includes(payload.trigger.type)) {
    return NextResponse.json({ ok: false, error: "trigger.type no es válido" }, { status: 400 });
  }

  if (payload.actions.some((action) => !action.type || !actionTypes.includes(action.type))) {
    return NextResponse.json({ ok: false, error: "actions contiene tipos inválidos" }, { status: 400 });
  }

  const workflow = await automationService.create({
    organizationId: payload.organizationId,
    name: payload.name.trim(),
    description: payload.description?.trim(),
    trigger: {
      type: payload.trigger.type,
      value: payload.trigger.value,
      windowMinutes: payload.trigger.windowMinutes,
    },
    conditions: (payload.conditions ?? []).map((condition, index) => ({
      id: `cond_${Date.now()}_${index}`,
      field: condition.field ?? "unknown",
      operator: condition.operator ?? "contains",
      value: condition.value,
    })),
    actions: payload.actions.map((action, index) => ({
      id: `act_${Date.now()}_${index}`,
      type: action.type as AutomationActionType,
      value: action.value,
      channel: action.channel,
    })),
  });

  // TODO(Supabase): persist normalized action/condition rows.
  // TODO(Meta Hooks): map send_message actions to provider dispatch workers.

  return NextResponse.json({ ok: true, data: workflow }, { status: 201 });
}
