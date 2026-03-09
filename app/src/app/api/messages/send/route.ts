import { inboxService, type Channel } from "@/lib/inbox-service";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/authz";

type SendMessageBody = {
  conversationId?: string;
  channel?: Channel;
  body?: string;
  senderUserId?: string;
};

export async function POST(request: Request) {
  let payload: SendMessageBody;

  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer"]);
    if (denied) return denied;

    payload = (await request.json()) as SendMessageBody;

    const { conversationId, channel, body, senderUserId } = payload;

    if (!conversationId || !channel || !body?.trim()) {
      return fail({ code: "VALIDATION_ERROR", message: "conversationId, channel y body son obligatorios" }, 400);
    }

    const result = await inboxService.sendMessage({
      organizationId: ctx.organizationId,
      conversationId,
      channel,
      body: body.trim(),
      senderUserId,
    });

    return ok(result, 202);
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
