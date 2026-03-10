import { createHash } from "node:crypto";
import { getWebhookEventById, processWebhook, type ProcessWebhookInput } from "@/lib/webhook-engine";
import type { SupportedChannel } from "@/lib/channel-adapters";

export interface ReplayBackoffConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  jitterPercent: number;
}

const backoffConfig: ReplayBackoffConfig = {
  baseDelayMs: Number(process.env.KALO_BACKOFF_BASE_MS ?? 60_000),
  maxDelayMs: Number(process.env.KALO_BACKOFF_MAX_MS ?? 900_000),
  jitterPercent: Number(process.env.KALO_BACKOFF_JITTER_PERCENT ?? 0.2),
};

function deterministicJitter(seed: string): number {
  const hash = createHash("sha256").update(seed).digest("hex").slice(0, 8);
  const num = parseInt(hash, 16) / 0xffffffff;
  return num;
}

export function getReplayBackoffConfig() {
  return backoffConfig;
}

export function nextBackoffDelayMs(attempt: number, seed: string): number {
  const exp = Math.min(backoffConfig.maxDelayMs, backoffConfig.baseDelayMs * Math.pow(2, Math.max(0, attempt - 1)));
  const jitter = (deterministicJitter(seed) * 2 - 1) * backoffConfig.jitterPercent;
  const withJitter = exp * (1 + jitter);
  return Math.max(1000, Math.round(withJitter));
}

export async function replayWebhookEvent(input: {
  eventId?: string;
  organizationId?: string;
  channel?: SupportedChannel;
  payload?: unknown;
  dryRun?: boolean;
  maxRetries?: number;
}) {
  const dryRun = input.dryRun !== false;
  const existing = input.eventId ? getWebhookEventById(input.eventId) : undefined;

  const organizationId = input.organizationId ?? existing?.organizationId ?? "org_1";
  const channel = input.channel ?? existing?.channel;
  const payload = input.payload ?? existing?.payloadJson;

  if (!channel || !payload) {
    throw new Error("Replay requiere channel y payload (o eventId existente)");
  }

  const seed = `${organizationId}:${channel}:${JSON.stringify(payload)}`;
  const deterministicOutput = createHash("sha256").update(seed).digest("hex").slice(0, 20);
  const delayMs = nextBackoffDelayMs((existing?.retryCount ?? 0) + 1, deterministicOutput);

  if (dryRun) {
    return {
      dryRun: true,
      deterministicOutput,
      plannedNextAttemptAt: new Date(Date.now() + delayMs).toISOString(),
      replayedFrom: existing?.id ?? null,
    };
  }

  const processInput: ProcessWebhookInput = {
    organizationId,
    channel,
    payload,
    externalId: existing?.externalId,
    maxRetries: input.maxRetries ?? existing?.maxRetries ?? 3,
  };

  const result = await processWebhook(processInput);
  return {
    dryRun: false,
    deterministicOutput,
    event: result.event,
    idempotencyHit: result.idempotencyHit,
  };
}

export async function replayWebhookBatch(input: {
  items: Array<{ eventId?: string; organizationId?: string; channel?: SupportedChannel; payload?: unknown }>;
  dryRun?: boolean;
}) {
  const dryRun = input.dryRun !== false;
  const results = [] as Array<{ index: number; ok: boolean; data?: unknown; error?: string }>;

  for (let i = 0; i < input.items.length; i += 1) {
    try {
      const data = await replayWebhookEvent({ ...input.items[i], dryRun });
      results.push({ index: i, ok: true, data });
    } catch (error) {
      results.push({ index: i, ok: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  }

  return {
    dryRun,
    total: input.items.length,
    success: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}
