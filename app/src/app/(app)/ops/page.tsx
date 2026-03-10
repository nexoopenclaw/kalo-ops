import { OpsWorkspace } from "@/components/ops/ops-workspace";
import { channelDispatcher } from "@/lib/channel-adapters";
import { integrityCheckService } from "@/lib/integrity-check-service";
import { opsDiagnosticsService } from "@/lib/ops-diagnostics-service";
import { getReplayBackoffConfig } from "@/lib/webhook-replay-service";
import { listProviderAdapterStatus } from "@/lib/provider-runtime";

export default async function OpsPage() {
  const health = await channelDispatcher.health();
  const diagnostics = opsDiagnosticsService.snapshot("org_1");
  const integrity = await integrityCheckService.run("org_1");

  const metrics = [
    { channel: "instagram" as const, queueDepth: 14, slaBreaches: 2, backlog: 9 },
    { channel: "whatsapp" as const, queueDepth: 21, slaBreaches: 5, backlog: 12 },
    { channel: "email" as const, queueDepth: 8, slaBreaches: 1, backlog: 4 },
  ];

  return (
    <OpsWorkspace
      initialHealth={health}
      initialMetrics={metrics}
      diagnostics={diagnostics}
      integrity={integrity}
      providerAdapters={listProviderAdapterStatus()}
      backoffConfig={getReplayBackoffConfig()}
    />
  );
}
