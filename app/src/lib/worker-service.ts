import { automationQueue } from "@/lib/automation-queue";
import { digestService } from "@/lib/digest-service";
import { getPersistenceState } from "@/lib/in-memory-persistence";
import { getWebhookMetrics, listWebhookEvents, retryWebhookEvent } from "@/lib/webhook-engine";

export interface WorkerJob {
  id: string;
  organizationId: string;
  type: "automation" | "webhook_retry" | "digest";
  status: "pending" | "running" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const jobs: WorkerJob[] = [];

function clone<T>(input: T): T {
  return structuredClone(input);
}

function enqueue(orgId: string, type: WorkerJob["type"], payload: Record<string, unknown>, maxAttempts = 3) {
  const now = new Date().toISOString();
  const job: WorkerJob = {
    id: `worker_job_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    organizationId: orgId,
    type,
    status: "pending",
    attempts: 0,
    maxAttempts,
    lastError: null,
    payload,
    createdAt: now,
    updatedAt: now,
  };
  jobs.push(job);
  return job;
}

async function runJob(job: WorkerJob) {
  job.status = "running";
  job.updatedAt = new Date().toISOString();

  try {
    if (job.type === "automation") {
      await automationQueue.runNext(job.organizationId);
    }

    if (job.type === "webhook_retry") {
      const retrying = listWebhookEvents({ status: "retrying" }).find((event) => event.organizationId === job.organizationId);
      if (retrying) await retryWebhookEvent(retrying.id);
    }

    if (job.type === "digest") {
      const digestType = (job.payload.digestType as "daily" | "weekly" | undefined) ?? "daily";
      await digestService.run(job.organizationId, digestType);
    }

    job.status = "completed";
    job.updatedAt = new Date().toISOString();
  } catch (error) {
    job.attempts += 1;
    job.lastError = error instanceof Error ? error.message : "Worker job failed";
    job.updatedAt = new Date().toISOString();
    job.status = job.attempts >= job.maxAttempts ? "failed" : "pending";
  }
}

export const workerService = {
  seed(orgId: string) {
    enqueue(orgId, "automation", {});
    enqueue(orgId, "webhook_retry", {});
    enqueue(orgId, "digest", { digestType: "daily" });
  },

  async tick(organizationId: string) {
    if (!jobs.some((job) => job.organizationId === organizationId)) this.seed(organizationId);
    const next = jobs.find((job) => job.organizationId === organizationId && job.status === "pending");
    if (!next) return { ran: false, message: "No pending jobs" };

    await runJob(next);
    return { ran: true, job: clone(next) };
  },

  status(organizationId: string) {
    const scoped = jobs.filter((job) => job.organizationId === organizationId);
    const webhookMetrics = getWebhookMetrics();
    const state = getPersistenceState();

    return {
      total: scoped.length,
      pending: scoped.filter((job) => job.status === "pending").length,
      running: scoped.filter((job) => job.status === "running").length,
      failed: scoped.filter((job) => job.status === "failed").length,
      completed: scoped.filter((job) => job.status === "completed").length,
      jobs: scoped.slice(-25).reverse().map(clone),
      queueDepth: {
        automation: automationQueue.getStatus(organizationId).pending,
        webhookRetry: webhookMetrics.retryQueueSize,
        digestRuns: digestService.listRuns(organizationId).length,
      },
      webhookRetryBacklog: state.webhookEvents.filter((event) => event.organizationId === organizationId && event.status === "retrying").length,
      lastDigestRun: digestService.getLastRun(organizationId),
    };
  },

  enqueueDigest(organizationId: string, digestType: "daily" | "weekly") {
    return enqueue(organizationId, "digest", { digestType });
  },
};
