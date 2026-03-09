import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/authz";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { digestService } from "@/lib/digest-service";
import { workerService } from "@/lib/worker-service";

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter"]);
    if (denied) return denied;

    const body = (await request.json().catch(() => ({}))) as { type?: "daily" | "weekly"; enqueue?: boolean };
    const type = body.type === "weekly" ? "weekly" : "daily";

    if (body.enqueue) {
      const job = workerService.enqueueDigest(ctx.organizationId, type);
      return ok({ queued: true, job }, 202);
    }

    const run = await digestService.run(ctx.organizationId, type);
    return ok({ queued: false, run });
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
