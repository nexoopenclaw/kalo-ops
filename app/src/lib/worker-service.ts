import { randomUUID } from "node:crypto";
import { automationQueue } from "@/lib/automation-queue";
import { digestService } from "@/lib/digest-service";
import { getPersistenceState, type WorkerJobStore } from "@/lib/in-memory-persistence";
import { getWebhookMetrics, listWebhookEvents, retryWebhookEvent } from "@/lib/webhook-engine";

export interface WorkerJob extends WorkerJobStore {}

const LEASE_MS = 30_000;

function clone<T>(input: T): T {
  return structuredClone(input);
}

function nowIso() {
  return new Date().toISOString();
}

function getState() {
  return getPersistenceState();
}

function enqueue(orgId: string, type: WorkerJob["type"], payload: Record<string, unknown>, maxAttempts = 3) {
  const now = nowIso();
  const job: WorkerJob = {
    id: `worker_job_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    organizationId: orgId,
    type,
    status: "pending",
    attempts: 0,
    maxAttempts,
    leaseOwner: null,
    leaseExpiresAt: null,
    lockedAt: null,
    retryCount: 0,
    lastError: null,
    lastAttemptAt: null,
    nextAttemptAt: null,
    payload,
    createdAt: now,
    updatedAt: now,
  };
  getState().workerJobs.push(job);
  return clone(job);
}

function seed(orgId: string) {
  const state = getState();
  if (state.workerJobs.some((job) => job.organizationId === orgId)) return;
  enqueue(orgId, "automation", {});
  enqueue(orgId, "webhook_retry", {});
  enqueue(orgId, "digest", { digestType: "daily" });
}

function canAcquire(job: WorkerJob) {
  if (job.status !== "pending") return false;
  if (!job.nextAttemptAt) return true;
  return +new Date(job.nextAttemptAt) <= Date.now();
}

function acquireNext(orgId: string, leaseOwner: string) {
  const state = getState();
  const pending = state.workerJobs
    .filter((job) => job.organizationId === orgId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const next = pending.find(canAcquire);
  if (!next) return null;

  next.status = "running";
  next.leaseOwner = leaseOwner;
  next.lockedAt = nowIso();
  next.leaseExpiresAt = new Date(Date.now() + LEASE_MS).toISOString();
  next.updatedAt = nowIso();
  return next;
}

async function execute(job: WorkerJob) {
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
}

function releaseSuccess(job: WorkerJob) {
  job.status = "completed";
  job.attempts += 1;
  job.lastAttemptAt = nowIso();
  job.leaseOwner = null;
  job.lockedAt = null;
  job.leaseExpiresAt = null;
  job.updatedAt = nowIso();
}

function releaseFailure(job: WorkerJob, error: unknown) {
  job.attempts += 1;
  job.retryCount += 1;
  job.lastAttemptAt = nowIso();
  job.lastError = error instanceof Error ? error.message : "Worker job failed";
  job.leaseOwner = null;
  job.lockedAt = null;
  job.leaseExpiresAt = null;
  job.updatedAt = nowIso();
  if (job.attempts >= job.maxAttempts) {
    job.status = "failed";
    job.nextAttemptAt = null;
  } else {
    const backoffMs = Math.min(60_000, Math.max(5_000, 5_000 * 2 ** (job.attempts - 1)));
    job.status = "pending";
    job.nextAttemptAt = new Date(Date.now() + backoffMs).toISOString();
  }
}

export const workerService = {
  seed,

  enqueueDigest(organizationId: string, digestType: "daily" | "weekly") {
    return enqueue(organizationId, "digest", { digestType });
  },

  listJobs(organizationId: string, status?: WorkerJob["status"]) {
    const scoped = getState().workerJobs.filter((job) => job.organizationId === organizationId && (!status || job.status === status));
    return scoped.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).map(clone);
  },

  requeueJob(organizationId: string, jobId: string) {
    const job = getState().workerJobs.find((item) => item.organizationId === organizationId && item.id === jobId);
    if (!job) return null;
    job.status = "pending";
    job.nextAttemptAt = null;
    job.leaseOwner = null;
    job.leaseExpiresAt = null;
    job.lockedAt = null;
    job.lastError = null;
    job.updatedAt = nowIso();
    return clone(job);
  },

  async tick(organizationId: string) {
    seed(organizationId);
    const leaseOwner = `tick_${randomUUID().slice(0, 8)}`;
    const next = acquireNext(organizationId, leaseOwner);
    if (!next) return { ran: false, message: "No pending jobs" };

    try {
      await execute(next);
      releaseSuccess(next);
      return { ran: true, job: clone(next), leaseOwner };
    } catch (error) {
      releaseFailure(next, error);
      return { ran: true, job: clone(next), leaseOwner, error: next.lastError };
    }
  },

  status(organizationId: string) {
    seed(organizationId);
    const scoped = getState().workerJobs.filter((job) => job.organizationId === organizationId);
    const webhookMetrics = getWebhookMetrics();

    return {
      total: scoped.length,
      pending: scoped.filter((job) => job.status === "pending").length,
      running: scoped.filter((job) => job.status === "running").length,
      failed: scoped.filter((job) => job.status === "failed").length,
      completed: scoped.filter((job) => job.status === "completed").length,
      retrying: scoped.filter((job) => job.status === "pending" && job.retryCount > 0).length,
      jobs: scoped.slice(-25).reverse().map(clone),
      queueDepth: {
        automation: automationQueue.getStatus(organizationId).pending,
        webhookRetry: webhookMetrics.retryQueueSize,
        digestRuns: digestService.listRuns(organizationId).length,
      },
      leaseMs: LEASE_MS,
      lastDigestRun: digestService.getLastRun(organizationId),
    };
  },
};
