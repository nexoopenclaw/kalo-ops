import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { listLeads } from "@/lib/db/repositories/leads-repository";
import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/authz";

export async function GET(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer", "viewer"]);
    if (denied) return denied;

    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 25);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return fail({ code: "VALIDATION_ERROR", message: "limit must be an integer between 1 and 100" }, 400);
    }

    const data = await listLeads(ctx, limit);
    return ok(data);
  } catch (error) {
    if (error instanceof AuthContextError) {
      return fail({ code: error.code, message: error.message }, error.status);
    }
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
