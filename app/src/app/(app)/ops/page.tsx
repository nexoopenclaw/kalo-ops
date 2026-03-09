import { OpsWorkspace } from "@/components/ops/ops-workspace";
import { channelDispatcher } from "@/lib/channel-adapters";
import { workerService } from "@/lib/worker-service";

export default async function OpsPage() {
  const health = await channelDispatcher.health();

  const workerStatus = workerService.status("org_1");

  const metrics = [
    { channel: "instagram" as const, queueDepth: 14, slaBreaches: 2, backlog: 9 },
    { channel: "whatsapp" as const, queueDepth: 21, slaBreaches: 5, backlog: 12 },
    { channel: "email" as const, queueDepth: 8, slaBreaches: 1, backlog: 4 },
  ];

  return <OpsWorkspace initialHealth={health} initialMetrics={metrics} diagnostics={workerStatus} />;
}
