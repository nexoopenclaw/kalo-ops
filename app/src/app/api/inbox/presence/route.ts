import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { requireRole } from "@/lib/authz";
import { fail, ok } from "@/lib/api-response";
import { inboxService } from "@/lib/inbox-service";

export async function GET(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer", "viewer"]);
    if (denied) return denied;

    const setters = await inboxService.listSetters();
    const data = setters.map((setter, index) => ({
      userId: setter.id,
      name: setter.name,
      online: index % 2 === 0,
      lastSeenAt: new Date(Date.now() - (index + 1) * 60_000).toISOString(),
    }));

    return ok(data);
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
