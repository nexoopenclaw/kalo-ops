import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { upsertDealNote } from "@/lib/db/repositories/deals-repository";
import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/authz";

type Body = { dealId?: string; note?: string; objections?: string[] };

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer"]);
    if (denied) return denied;

    const body = (await request.json()) as Body;
    if (!body.dealId || !body.note?.trim()) return fail({ code: "VALIDATION_ERROR", message: "dealId and note are required" }, 400);
    const objections = Array.isArray(body.objections) ? body.objections.filter((o): o is string => typeof o === "string") : [];
    const data = await upsertDealNote(ctx, { dealId: body.dealId, note: body.note.trim(), objections });
    if (!data) return fail({ code: "NOT_FOUND", message: "Deal not found" }, 404);
    return ok(data);
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
