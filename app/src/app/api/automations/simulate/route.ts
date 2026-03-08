import { NextResponse } from "next/server";
import { automationService } from "@/lib/automation-service";

type SimulateBody = {
  organizationId?: string;
  workflowId?: string;
  context?: Record<string, unknown>;
};

export async function POST(request: Request) {
  let payload: SimulateBody;

  try {
    payload = (await request.json()) as SimulateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.organizationId || !payload.workflowId) {
    return NextResponse.json({ ok: false, error: "organizationId y workflowId son obligatorios" }, { status: 400 });
  }

  const log = await automationService.simulateRun({
    organizationId: payload.organizationId,
    workflowId: payload.workflowId,
    context: payload.context ?? {},
  });

  if (!log) {
    return NextResponse.json({ ok: false, error: "Workflow no encontrado" }, { status: 404 });
  }

  // TODO(Supabase): persist log + increment execution_count atomically.
  // TODO(Meta Hooks): execute side-effects through async queue, not inline API response path.

  return NextResponse.json({ ok: true, data: log }, { status: 202 });
}
