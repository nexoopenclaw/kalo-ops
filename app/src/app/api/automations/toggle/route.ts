import { NextResponse } from "next/server";
import { automationService } from "@/lib/automation-service";

type ToggleBody = {
  organizationId?: string;
  workflowId?: string;
  active?: boolean;
};

export async function POST(request: Request) {
  let payload: ToggleBody;

  try {
    payload = (await request.json()) as ToggleBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.organizationId || !payload.workflowId || typeof payload.active !== "boolean") {
    return NextResponse.json({ ok: false, error: "organizationId, workflowId y active son obligatorios" }, { status: 400 });
  }

  const updated = await automationService.toggle({
    organizationId: payload.organizationId,
    workflowId: payload.workflowId,
    active: payload.active,
  });

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Workflow no encontrado" }, { status: 404 });
  }

  // TODO(Supabase): update active flag in public.automations.
  return NextResponse.json({ ok: true, data: updated });
}
