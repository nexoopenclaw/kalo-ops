import { automationQueue } from "@/lib/automation-queue";
import { revenueBridgeService } from "@/lib/revenue-bridge-service";
import { workerService } from "@/lib/worker-service";
import { getWebhookMetrics } from "@/lib/webhook-engine";

export const opsDiagnosticsService = {
  snapshot(organizationId: string) {
    const worker = workerService.status(organizationId);
    const webhook = getWebhookMetrics();
    const bridge = revenueBridgeService.getDiagnostics(8);

    return {
      workerStatus: {
        total: worker.total,
        pending: worker.pending,
        running: worker.running,
        failed: worker.failed,
        completed: worker.completed,
      },
      queueBacklogs: {
        automation: automationQueue.getStatus(organizationId).pending,
        webhookRetry: worker.queueDepth.webhookRetry,
        digestRuns: worker.queueDepth.digestRuns,
      },
      bridgeProcessingStats: bridge,
      latestFailuresByCategory: bridge.latestFailuresByCategory,
      webhookMetrics: webhook,
      generatedAt: new Date().toISOString(),
    };
  },
};
