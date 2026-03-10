import { fail, ok } from "@/lib/api-response";
import { deliveryOrchestrator } from "@/lib/delivery-orchestrator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = String(searchParams.get("organizationId") ?? "org_1");
  const limit = Number(searchParams.get("limit") ?? "50");

  if (!Number.isFinite(limit) || limit <= 0) {
    return fail({ code: "VALIDATION_ERROR", message: "limit must be a positive number" }, 400);
  }

  return ok(deliveryOrchestrator.history(organizationId, Math.min(200, limit)));
}
