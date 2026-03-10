import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/authz";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { workerService } from "@/lib/worker-service";

export async function GET(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer", "viewer"]);
    if (denied) return denied;

    const url = new URL(request.url);
    const status = (url.searchParams.get("status") ?? "").trim() as "pending" | "running" | "failed" | "completed" | "";
    if (status && !["pending", "running", "failed", "completed"].includes(status)) {
      return fail({ code: "VALIDATION_ERROR", message: "status inválido" }, 400);
    }

    const jobs = workerService.listJobs(ctx.organizationId, status || undefined);
    return ok({ status: status || "all", count: jobs.length, jobs });
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
