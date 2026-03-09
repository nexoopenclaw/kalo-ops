import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { updateDealStage } from "@/lib/db/repositories/deals-repository";
import type { DealStage } from "@/lib/db/types";
import { canTransitionDeal, requireRole } from "@/lib/authz";
import { fail, ok } from "@/lib/api-response";

type Body = { dealId?: string; nextStage?: DealStage; reason?: string; note?: string };
const allowedStages: DealStage[] = ["new", "qualified", "booked", "show", "won", "lost"];

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer"]);
    if (denied) return denied;

    const body = (await request.json()) as Body;
    if (!body.dealId || !body.nextStage) return fail({ code: "VALIDATION_ERROR", message: "dealId and nextStage are required" }, 400);
    if (!allowedStages.includes(body.nextStage)) return fail({ code: "VALIDATION_ERROR", message: "nextStage is invalid" }, 400);

    const canTransition = await canTransitionDeal(ctx, body.dealId, body.nextStage);
    if (!canTransition) return fail({ code: "RBAC_FORBIDDEN", message: "Role cannot transition this deal" }, 403);

    const data = await updateDealStage(ctx, { dealId: body.dealId, nextStage: body.nextStage, reason: body.reason, note: body.note });
    if (!data) return fail({ code: "NOT_FOUND", message: "Deal not found" }, 404);

    return ok(data);
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
