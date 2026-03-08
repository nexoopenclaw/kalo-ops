import { NextResponse } from "next/server";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { createAutomation } from "@/lib/db/repositories/automations-repository";

type Body = {
  name?: string;
  description?: string;
  trigger?: { type?: string; value?: string; windowMinutes?: number };
  actions?: unknown[];
  conditions?: unknown[];
};

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const body = (await request.json()) as Body;
    if (!body.name?.trim() || !body.trigger?.type || !Array.isArray(body.actions) || body.actions.length === 0) {
      return NextResponse.json({ ok: false, error: "name, trigger and actions are required" }, { status: 400 });
    }

    const data = await createAutomation(ctx, {
      name: body.name.trim(),
      description: body.description?.trim(),
      triggerType: body.trigger.type,
      triggerValue: body.trigger.value,
      triggerWindowMinutes: body.trigger.windowMinutes,
      conditions: body.conditions ?? [],
      actions: body.actions,
    });

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthContextError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
