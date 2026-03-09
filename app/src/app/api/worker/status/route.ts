import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/authz";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { workerService } from "@/lib/worker-service";

export async function GET(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer", "viewer"]);
    if (denied) return denied;

    return ok(workerService.status(ctx.organizationId));
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
