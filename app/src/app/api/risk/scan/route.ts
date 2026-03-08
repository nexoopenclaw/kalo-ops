import { fail, ok } from "@/lib/api-response";
import { riskAutomationService } from "@/lib/risk-automation-service";

interface ScanBody {
  organizationId?: string;
}

export async function POST(request: Request) {
  let body: ScanBody = {};

  try {
    body = (await request.json()) as ScanBody;
  } catch {
    body = {};
  }

  const organizationId = (body.organizationId ?? "org_1").trim();
  if (!organizationId) {
    return fail({ code: "VALIDATION_ERROR", message: "organizationId is required" }, 400);
  }

  const data = await riskAutomationService.runScan(organizationId);
  return ok(data);
}
