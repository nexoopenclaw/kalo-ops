import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { requireRole } from "@/lib/authz";
import { fail, ok } from "@/lib/api-response";
import { automationAuditService } from "@/lib/automation-audit-service";

export async function GET(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer", "viewer"]);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "25");
    return ok(automationAuditService.list(ctx.organizationId, Number.isFinite(limit) ? Math.min(100, limit) : 25));
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
