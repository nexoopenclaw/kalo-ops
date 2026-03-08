import { automationExecutor, type AutomationExecutionEntry, type AutomationTriggerPayload } from "@/lib/automation-executor";

export type AutomationQueueStatus = "pending" | "running" | "failed" | "completed";

export interface AutomationQueueJob {
  id: string;
  organizationId: string;
  payload: AutomationTriggerPayload;
  status: AutomationQueueStatus;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const jobs: AutomationQueueJob[] = [];

function cloneJob(job: AutomationQueueJob): AutomationQueueJob {
  return structuredClone(job);
}

export const automationQueue = {
  enqueue(payload: AutomationTriggerPayload, maxRetries = 2): AutomationQueueJob {
    const now = new Date().toISOString();
    const job: AutomationQueueJob = {
      id: `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      organizationId: payload.organizationId,
      payload,
      status: "pending",
      retryCount: 0,
      maxRetries,
      lastError: null,
      nextRetryAt: null,
      createdAt: now,
      updatedAt: now,
    };

    jobs.push(job);
    return cloneJob(job);
  },

  async runNext(organizationId: string): Promise<{ job: AutomationQueueJob | null; executions: AutomationExecutionEntry[] }> {
    const nowMs = Date.now();
    const next = jobs.find(
      (job) =>
        job.organizationId === organizationId &&
        job.status === "pending" &&
        (!job.nextRetryAt || +new Date(job.nextRetryAt) <= nowMs),
    );

    if (!next) return { job: null, executions: [] };

    next.status = "running";
    next.updatedAt = new Date().toISOString();

    try {
      const executions = await automationExecutor.executeTrigger(next.payload);
      if (executions.length === 0) {
        next.status = "failed";
        next.lastError = "No hay workflows activos para este trigger";
        next.updatedAt = new Date().toISOString();
      } else {
        next.status = "completed";
        next.updatedAt = new Date().toISOString();
      }
      return { job: cloneJob(next), executions };
    } catch (error) {
      next.retryCount += 1;
      next.lastError = error instanceof Error ? error.message : "Error desconocido";
      next.updatedAt = new Date().toISOString();

      if (next.retryCount > next.maxRetries) {
        next.status = "failed";
        next.nextRetryAt = null;
      } else {
        next.status = "pending";
        const backoffMs = Math.min(30000, 1000 * 2 ** next.retryCount);
        next.nextRetryAt = new Date(Date.now() + backoffMs).toISOString();
      }

      return { job: cloneJob(next), executions: [] };
    }
  },

  getStatus(organizationId: string) {
    const scoped = jobs.filter((job) => job.organizationId === organizationId);

    return {
      total: scoped.length,
      pending: scoped.filter((job) => job.status === "pending").length,
      running: scoped.filter((job) => job.status === "running").length,
      failed: scoped.filter((job) => job.status === "failed").length,
      completed: scoped.filter((job) => job.status === "completed").length,
      jobs: scoped.slice(-25).reverse().map(cloneJob),
    };
  },
};
