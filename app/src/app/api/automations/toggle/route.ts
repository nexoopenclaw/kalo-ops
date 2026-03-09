import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { toggleAutomation } from "@/lib/db/repositories/automations-repository";
import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/authz";

type Body = { workflowId?: string; active?: boolean };

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin"]);
    if (denied) return denied;

    const body = (await request.json()) as Body;
    if (!body.workflowId || typeof body.active !== "boolean") {
      return fail({ code: "VALIDATION_ERROR", message: "workflowId and active are required" }, 400);
    }

    const data = await toggleAutomation(ctx, { workflowId: body.workflowId, active: body.active });
    if (!data) return fail({ code: "NOT_FOUND", message: "Workflow not found" }, 404);
    return ok(data);
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
