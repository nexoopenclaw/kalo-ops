import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { automationExecutor, type AutomationTriggerPayload } from "@/lib/automation-executor";
import { recordExecution } from "@/lib/db/repositories/automations-repository";
import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/authz";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getRequestId, logger } from "@/lib/logger";
import { featureFlags } from "@/lib/feature-flags";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const limit = checkRateLimit({ key: getClientKey(request, "automations_execute"), limit: 20, windowMs: 60_000 });
  if (!limit.allowed) {
    logger.warn("Rate limit exceeded on automations execute", { requestId, route: "/api/automations/execute" });
    return fail({ code: "RATE_LIMITED", message: "Demasiadas ejecuciones por minuto" }, 429);
  }

  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer"]);
    if (denied) return denied;

    const payload = (await request.json()) as Partial<AutomationTriggerPayload>;
    if (!payload.triggerType) return fail({ code: "VALIDATION_ERROR", message: "triggerType is required" }, 400);

    const executions = await automationExecutor.executeTrigger({
      organizationId: ctx.organizationId,
      triggerType: payload.triggerType,
      triggerValue: payload.triggerValue,
      workflowId: payload.workflowId,
      context: {
        ...(payload.context ?? {}),
        executionMode: featureFlags.isEnabled("automations_live_execute") ? "live" : "mock",
      },
    });

    for (const entry of executions) {
      await recordExecution(ctx, {
        workflowId: entry.workflowId,
        status: entry.status,
        summary: entry.reason,
        context: entry.trigger.context,
      });
    }

    logger.info("Automation execute completed", { requestId, route: "/api/automations/execute", organizationId: ctx.organizationId, executions: executions.length });
    return ok(executions, 202);
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
