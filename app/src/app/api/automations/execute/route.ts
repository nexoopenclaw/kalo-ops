import { NextResponse } from "next/server";
import { automationExecutor, type AutomationTriggerPayload } from "@/lib/automation-executor";

export async function POST(request: Request) {
  let payload: Partial<AutomationTriggerPayload>;

  try {
    payload = (await request.json()) as Partial<AutomationTriggerPayload>;
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON inválido" }, { status: 400 });
  }

  if (!payload.organizationId || !payload.triggerType) {
    return NextResponse.json({ ok: false, error: "organizationId y triggerType son obligatorios" }, { status: 400 });
  }

  const executions = await automationExecutor.executeTrigger({
    organizationId: payload.organizationId,
    triggerType: payload.triggerType,
    triggerValue: payload.triggerValue,
    workflowId: payload.workflowId,
    context: payload.context ?? {},
  });

  return NextResponse.json({ ok: true, data: executions }, { status: 202 });
}
