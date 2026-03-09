import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { requireRole } from "@/lib/authz";
import { fail, ok } from "@/lib/api-response";

type Body = { conversationId?: string; assignedToUserId?: string };

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer"]);
    if (denied) return denied;

    const body = (await request.json()) as Body;
    if (!body.conversationId || !body.assignedToUserId) {
      return fail({ code: "VALIDATION_ERROR", message: "conversationId and assignedToUserId are required" }, 400);
    }

    return ok({
      conversationId: body.conversationId,
      assignedToUserId: body.assignedToUserId,
      pingedByUserId: ctx.user.id,
      pingedAt: new Date().toISOString(),
      status: "queued",
    });
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
