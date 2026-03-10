import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/authz";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { workerService } from "@/lib/worker-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter"]);
    if (denied) return denied;

    const { id } = await context.params;
    const job = workerService.requeueJob(ctx.organizationId, id);
    if (!job) return fail({ code: "NOT_FOUND", message: "Job no encontrado" }, 404);

    return ok({ requeued: true, job });
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
