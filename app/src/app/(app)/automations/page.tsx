import { AutomationWorkspace } from "@/components/automations/automation-workspace";
import { automationService } from "@/lib/automation-service";

export default async function AutomationsPage() {
  const workflows = await automationService.list("org_1");

  return <AutomationWorkspace initialWorkflows={workflows} />;
}
