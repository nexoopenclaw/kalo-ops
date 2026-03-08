import { HoyWorkspace } from "@/components/hoy/hoy-workspace";
import { riskAutomationService } from "@/lib/risk-automation-service";

export default async function HoyPage() {
  const data = await riskAutomationService.getCockpit("org_1");
  return <HoyWorkspace initialData={data} />;
}
