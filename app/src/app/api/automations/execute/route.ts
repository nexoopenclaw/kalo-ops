import { NextResponse } from "next/server";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { automationExecutor, type AutomationTriggerPayload } from "@/lib/automation-executor";
import { recordExecution } from "@/lib/db/repositories/automations-repository";

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const payload = (await request.json()) as Partial<AutomationTriggerPayload>;
    if (!payload.triggerType) return NextResponse.json({ ok: false, error: "triggerType is required" }, { status: 400 });

    const executions = await automationExecutor.executeTrigger({
      organizationId: ctx.organizationId,
      triggerType: payload.triggerType,
      triggerValue: payload.triggerValue,
      workflowId: payload.workflowId,
      context: payload.context ?? {},
    });

    for (const entry of executions) {
      await recordExecution(ctx, {
        workflowId: entry.workflowId,
        status: entry.status,
        summary: entry.reason,
        context: entry.trigger.context,
      });
    }

    return NextResponse.json({ ok: true, data: executions }, { status: 202 });
  } catch (error) {
    if (error instanceof AuthContextError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
