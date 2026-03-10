import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/authz";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { outboundSafeguards } from "@/lib/outbound-safeguards";

export async function GET(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin", "setter", "closer", "viewer"]);
    if (denied) return denied;
    return ok({ organizationId: ctx.organizationId, globalDryRun: outboundSafeguards.getGlobalDryRun(ctx.organizationId) });
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const denied = requireRole(ctx, ["owner", "admin"]);
    if (denied) return denied;

    const body = (await request.json().catch(() => null)) as { globalDryRun?: boolean } | null;
    if (typeof body?.globalDryRun !== "boolean") {
      return fail({ code: "VALIDATION_ERROR", message: "globalDryRun boolean requerido" }, 400);
    }

    return ok(outboundSafeguards.setGlobalDryRun(ctx.organizationId, body.globalDryRun));
  } catch (error) {
    if (error instanceof AuthContextError) return fail({ code: error.code, message: error.message }, error.status);
    return fail({ code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}
