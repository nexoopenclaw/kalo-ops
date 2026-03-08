import { NextResponse } from "next/server";
import { automationQueue } from "@/lib/automation-queue";
import type { AutomationTriggerPayload } from "@/lib/automation-executor";

type Body = Partial<AutomationTriggerPayload> & { maxRetries?: number };

export async function POST(request: Request) {
  let payload: Body;

  try {
    payload = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON inválido" }, { status: 400 });
  }

  if (!payload.organizationId || !payload.triggerType) {
    return NextResponse.json({ ok: false, error: "organizationId y triggerType son obligatorios" }, { status: 400 });
  }

  const job = automationQueue.enqueue(
    {
      organizationId: payload.organizationId,
      triggerType: payload.triggerType,
      triggerValue: payload.triggerValue,
      workflowId: payload.workflowId,
      context: payload.context ?? {},
    },
    payload.maxRetries ?? 2,
  );

  return NextResponse.json({ ok: true, data: job }, { status: 201 });
}
