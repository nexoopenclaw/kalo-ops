import { fail, ok } from "@/lib/api-response";
import { attributionService } from "@/lib/attribution-service";

export async function GET(_: Request, context: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await context.params;
  if (!leadId) return fail({ code: "VALIDATION_ERROR", message: "leadId es obligatorio" }, 400);

  const data = await attributionService.explainLeadAttribution(leadId, "org_1");
  return ok(data);
}
