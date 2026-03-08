import { CrmWorkspace } from "@/components/crm/crm-workspace";
import { crmService } from "@/lib/crm-service";

export default async function CrmPage() {
  const [deals, funnelSummary] = await Promise.all([crmService.listDeals("org_1"), crmService.getFunnelSummary("org_1", 5)]);

  return <CrmWorkspace initialDeals={deals} initialSummary={funnelSummary} />;
}
