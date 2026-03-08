import { NextResponse } from "next/server";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { toggleAutomation } from "@/lib/db/repositories/automations-repository";

type Body = { workflowId?: string; active?: boolean };

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const body = (await request.json()) as Body;
    if (!body.workflowId || typeof body.active !== "boolean") {
      return NextResponse.json({ ok: false, error: "workflowId and active are required" }, { status: 400 });
    }

    const data = await toggleAutomation(ctx, { workflowId: body.workflowId, active: body.active });
    if (!data) return NextResponse.json({ ok: false, error: "Workflow not found" }, { status: 404 });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof AuthContextError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
