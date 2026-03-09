import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { createLead } from "@/lib/db/repositories/leads-repository";
import { fail, ok } from "@/lib/api-response";
import { canAccessLead, requireRole } from "@/lib/authz";

type CreateLeadBody = { fullName?: string; email?: string; phone?: string; source?: string; assignedToUserId?: string | null };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer"]);
    if (denied) return denied;

    const body = (await request.json()) as CreateLeadBody;
    const fullName = body.fullName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!fullName || fullName.length < 2) return fail({ code: "VALIDATION_ERROR", message: "fullName is required (min 2 chars)" }, 400);
    if (!email || !isValidEmail(email)) return fail({ code: "VALIDATION_ERROR", message: "email is required and must be valid" }, 400);

    const data = await createLead(ctx, { fullName, email, phone: body.phone?.trim(), source: body.source?.trim(), assignedToUserId: body.assignedToUserId ?? null });

    if (body.assignedToUserId && !(await canAccessLead(ctx, data.id))) {
      return fail({ code: "RBAC_FORBIDDEN", message: "Lead created but assignment is not visible for current role" }, 403);
    }

    return ok(data, 201);
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
