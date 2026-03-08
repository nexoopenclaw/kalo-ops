import { HealthWorkspace } from "@/components/health/health-workspace";
import { healthService } from "@/lib/health-service";

export default async function HealthPage() {
  const [summary, orgs] = await Promise.all([healthService.getSummary("org_1"), healthService.listOrgs("org_1")]);

  return <HealthWorkspace summary={summary} orgs={orgs} />;
}
