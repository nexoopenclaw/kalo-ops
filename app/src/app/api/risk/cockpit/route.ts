import { ok } from "@/lib/api-response";
import { riskAutomationService } from "@/lib/risk-automation-service";

export async function GET() {
  const data = await riskAutomationService.getCockpit("org_1");
  return ok(data);
}
