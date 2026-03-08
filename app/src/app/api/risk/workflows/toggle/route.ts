import { fail, ok } from "@/lib/api-response";
import { riskAutomationService } from "@/lib/risk-automation-service";

interface ToggleBody {
  organizationId?: string;
  workflowId?: string;
  enabled?: boolean;
}

export async function POST(request: Request) {
  let body: ToggleBody;
  try {
    body = (await request.json()) as ToggleBody;
  } catch {
    return fail({ code: "BAD_JSON", message: "Invalid JSON body" }, 400);
  }

  const organizationId = (body.organizationId ?? "org_1").trim();
  const workflowId = (body.workflowId ?? "").trim();

  if (!organizationId || !workflowId || typeof body.enabled !== "boolean") {
    return fail({ code: "VALIDATION_ERROR", message: "organizationId, workflowId y enabled son requeridos" }, 400);
  }

  const updated = await riskAutomationService.toggleWorkflow(organizationId, workflowId, body.enabled);
  if (!updated) {
    return fail({ code: "NOT_FOUND", message: "workflow no encontrado" }, 404);
  }

  return ok(updated);
}
