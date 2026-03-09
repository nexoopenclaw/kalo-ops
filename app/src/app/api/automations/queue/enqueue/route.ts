import { automationQueue } from "@/lib/automation-queue";
import type { AutomationTriggerPayload } from "@/lib/automation-executor";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { requireRole } from "@/lib/authz";
import { fail, ok } from "@/lib/api-response";

type Body = Partial<AutomationTriggerPayload> & { maxRetries?: number };

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin"]);
    if (denied) return denied;

    const payload = (await request.json()) as Body;

    if (!payload.triggerType) {
      return fail({ code: "VALIDATION_ERROR", message: "triggerType es obligatorio" }, 400);
    }

    const job = automationQueue.enqueue(
      {
        organizationId: ctx.organizationId,
        triggerType: payload.triggerType,
        triggerValue: payload.triggerValue,
        workflowId: payload.workflowId,
        context: payload.context ?? {},
      },
      payload.maxRetries ?? 2,
    );

    return ok(job, 201);
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
