import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { createAutomation } from "@/lib/db/repositories/automations-repository";
import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/authz";

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
    const denied = requireRole(ctx, ["owner", "admin"]);
    if (denied) return denied;

    const body = (await request.json()) as Body;
    if (!body.name?.trim() || !body.trigger?.type || !Array.isArray(body.actions) || body.actions.length === 0) {
      return fail({ code: "VALIDATION_ERROR", message: "name, trigger and actions are required" }, 400);
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

    return ok(data, 201);
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
