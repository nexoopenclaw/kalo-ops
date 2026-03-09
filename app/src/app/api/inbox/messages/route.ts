import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { requireRole } from "@/lib/authz";
import { fail, ok } from "@/lib/api-response";
import { inboxService } from "@/lib/inbox-service";

export async function GET(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer", "viewer"]);
    if (denied) return denied;

    const conversationId = new URL(request.url).searchParams.get("conversationId")?.trim();
    if (!conversationId) return fail({ code: "VALIDATION_ERROR", message: "conversationId is required" }, 400);

    const data = await inboxService.getThread(conversationId);
    return ok(data.filter((item) => item.organizationId === ctx.organizationId));
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
