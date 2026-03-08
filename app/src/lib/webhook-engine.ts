import { createHash, randomUUID } from "node:crypto";
import { channelDispatcher, type SupportedChannel } from "@/lib/channel-adapters";
import {
  getPersistenceState,
  type DeadLetterEventStore,
  type WebhookEventStatus,
  type WebhookEventStore,
  type WebhookProcessingLogEntryStore,
} from "@/lib/in-memory-persistence";

export interface RetryPolicy {
  retryCount: number;
  maxRetries: number;
  nextAttemptAt: string | null;
  failedPermanent: boolean;
}

export interface ProcessWebhookInput {
  organizationId: string;
  channel: SupportedChannel;
  payload: unknown;
  externalId?: string;
  maxRetries?: number;
}

export interface ProcessWebhookResult {
  event: WebhookEventStore;
  idempotencyHit: boolean;
}

const TRANSIENT_ERROR_KEYWORDS = ["force_fail", "timeout", "temporario", "retry"];

function toObject(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }
  return payload as Record<string, unknown>;
}

function pickExternalId(payloadObj: Record<string, unknown>, fallback: string): string {
  const rawExternalId = payloadObj.external_id ?? payloadObj.externalId ?? payloadObj.eventId;
  return String(rawExternalId ?? fallback).trim();
}

export function buildIdempotencyKey(input: {
  organizationId: string;
  channel: SupportedChannel;
  externalId: string;
  eventId: string;
}) {
  const base = `${input.organizationId}:${input.channel}:${input.externalId}:${input.eventId}`;
  return createHash("sha256").update(base).digest("hex");
}

export function buildRetryPolicy(retryCount: number, maxRetries: number): RetryPolicy {
  const failedPermanent = retryCount >= maxRetries;
  if (failedPermanent) {
    return {
      retryCount,
      maxRetries,
      failedPermanent,
      nextAttemptAt: null,
    };
  }

  const delayMs = Math.min(15 * 60 * 1000, Math.pow(2, retryCount) * 60 * 1000);
  return {
    retryCount,
    maxRetries,
    failedPermanent,
    nextAttemptAt: new Date(Date.now() + delayMs).toISOString(),
  };
}

function shouldFailTransient(body: string): boolean {
  const normalized = body.toLowerCase();
  return TRANSIENT_ERROR_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function listWebhookEvents(filters?: {
  channel?: SupportedChannel;
  status?: WebhookEventStatus;
  from?: string;
  to?: string;
  search?: string;
}) {
  const state = getPersistenceState();
  return state.webhookEvents
    .filter((event) => {
      if (filters?.channel && event.channel !== filters.channel) return false;
      if (filters?.status && event.status !== filters.status) return false;
      if (filters?.from && new Date(event.createdAt).getTime() < new Date(filters.from).getTime()) return false;
      if (filters?.to && new Date(event.createdAt).getTime() > new Date(filters.to).getTime()) return false;
      if (filters?.search && !event.externalId.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getWebhookEventById(id: string): WebhookEventStore | undefined {
  return getPersistenceState().webhookEvents.find((event) => event.id === id);
}

function upsertDeadLetter(event: WebhookEventStore, reason: string) {
  const state = getPersistenceState();
  const existing = state.deadLetterEvents.find((dlq) => dlq.webhookEventId === event.id);
  if (existing) {
    existing.reason = reason;
    return existing;
  }

  const deadLetter: DeadLetterEventStore = {
    id: randomUUID(),
    organizationId: event.organizationId,
    webhookEventId: event.id,
    reason,
    requeuedAt: null,
    createdAt: new Date().toISOString(),
  };

  state.deadLetterEvents.unshift(deadLetter);
  return deadLetter;
}

function appendLog(log: WebhookProcessingLogEntryStore[], level: "info" | "warn" | "error", message: string) {
  log.push({ at: new Date().toISOString(), level, message });
}

export async function processWebhook(input: ProcessWebhookInput): Promise<ProcessWebhookResult> {
  const state = getPersistenceState();
  const payloadObject = toObject(input.payload);
  const normalized = channelDispatcher.normalizeInbound(input.channel, input.payload);
  const externalId = input.externalId?.trim() || pickExternalId(payloadObject, normalized.eventId);
  const idempotencyKey = buildIdempotencyKey({
    organizationId: input.organizationId,
    channel: input.channel,
    externalId,
    eventId: normalized.eventId,
  });

  const duplicate = state.webhookEvents.find((event) => event.idempotencyKey === idempotencyKey);
  if (duplicate) {
    appendLog(duplicate.processingLog, "warn", "Evento duplicado detectado por idempotency key.");
    duplicate.updatedAt = new Date().toISOString();
    return { event: duplicate, idempotencyHit: true };
  }

  const processingLog: WebhookProcessingLogEntryStore[] = [];
  appendLog(processingLog, "info", "Envelope normalizado por canal adapter.");
  appendLog(processingLog, "info", "Evento despachado al pipeline de procesamiento interno.");

  const startedAt = Date.now();
  const simulatedBody = normalized.body;
  const shouldFail = shouldFailTransient(simulatedBody);

  let retryCount = 0;
  const maxRetries = Math.max(1, input.maxRetries ?? 3);
  let status: WebhookEventStatus = "processed";
  let errorMessage: string | null = null;

  if (shouldFail) {
    retryCount = 1;
    const retryPolicy = buildRetryPolicy(retryCount, maxRetries);
    status = retryPolicy.failedPermanent ? "failed_permanent" : "retrying";
    errorMessage = retryPolicy.failedPermanent
      ? "Fallo permanente al normalizar/routear evento."
      : "Fallo transitorio. Evento enviado a cola de reintento.";
    appendLog(
      processingLog,
      retryPolicy.failedPermanent ? "error" : "warn",
      retryPolicy.failedPermanent ? "Evento marcado como dead-letter." : "Evento en estado retrying con backoff exponencial.",
    );
  } else {
    appendLog(processingLog, "info", "Evento procesado correctamente por dispatcher multicanal.");
  }

  const retryPolicy = buildRetryPolicy(retryCount, maxRetries);
  const now = new Date().toISOString();
  const event: WebhookEventStore = {
    id: randomUUID(),
    organizationId: input.organizationId,
    channel: input.channel,
    externalId,
    idempotencyKey,
    payloadJson: payloadObject,
    normalizedPayload: normalized as unknown as Record<string, unknown>,
    processingLog,
    status,
    retryCount,
    maxRetries,
    nextAttemptAt: retryPolicy.nextAttemptAt,
    latencyMs: Date.now() - startedAt,
    errorMessage,
    createdAt: now,
    updatedAt: now,
  };

  if (event.status === "failed_permanent") {
    upsertDeadLetter(event, event.errorMessage ?? "Error no especificado");
  }

  state.webhookEvents.unshift(event);
  return { event, idempotencyHit: false };
}

export async function retryWebhookEvent(id: string) {
  const event = getWebhookEventById(id);
  if (!event) {
    return null;
  }

  event.retryCount += 1;
  const policy = buildRetryPolicy(event.retryCount, event.maxRetries);
  event.status = policy.failedPermanent ? "failed_permanent" : "retrying";
  event.nextAttemptAt = policy.nextAttemptAt;
  event.errorMessage = policy.failedPermanent ? "Se agotó el número máximo de reintentos." : null;
  event.updatedAt = new Date().toISOString();
  appendLog(
    event.processingLog,
    policy.failedPermanent ? "error" : "warn",
    policy.failedPermanent ? "Retry agotado. Evento derivado a dead-letter." : "Retry manual ejecutado. Evento sigue en cola.",
  );

  if (policy.failedPermanent) {
    upsertDeadLetter(event, event.errorMessage ?? "Retry agotado");
  }

  return event;
}

export async function requeueDeadLetter(id: string) {
  const state = getPersistenceState();
  const deadLetter = state.deadLetterEvents.find((item) => item.id === id);
  if (!deadLetter) {
    return null;
  }

  const event = state.webhookEvents.find((item) => item.id === deadLetter.webhookEventId);
  if (!event) {
    return null;
  }

  deadLetter.requeuedAt = new Date().toISOString();
  event.status = "retrying";
  event.errorMessage = null;
  event.nextAttemptAt = new Date(Date.now() + 30 * 1000).toISOString();
  event.updatedAt = new Date().toISOString();
  appendLog(event.processingLog, "info", "Evento reencolado manualmente desde dead-letter queue.");

  return { deadLetter, event };
}

export function getWebhookMetrics() {
  const state = getPersistenceState();
  const total = state.webhookEvents.length;
  const success = state.webhookEvents.filter((event) => event.status === "processed").length;
  const latencySamples = state.webhookEvents.map((event) => event.latencyMs);
  const avgLatency = latencySamples.length > 0 ? Math.round(latencySamples.reduce((a, b) => a + b, 0) / latencySamples.length) : 0;

  return {
    successRate: total === 0 ? 100 : Number(((success / total) * 100).toFixed(1)),
    avgLatencyMs: avgLatency,
    retryQueueSize: state.webhookEvents.filter((event) => event.status === "retrying").length,
    deadLetterCount: state.deadLetterEvents.length,
  };
}

export async function ensureWebhookSeed() {
  const state = getPersistenceState();
  if (state.webhookEvents.length > 0) return;

  await processWebhook({
    organizationId: "org_1",
    channel: "instagram",
    externalId: "ig_evt_seed_1",
    payload: {
      organizationId: "org_1",
      eventId: "evt_seed_ig_1",
      external_id: "ig_evt_seed_1",
      conversationExternalId: "ig_conv_443",
      senderExternalId: "ig_lead_22",
      senderName: "Valentina R.",
      body: "Necesito más info del programa premium.",
    },
  });

  await processWebhook({
    organizationId: "org_1",
    channel: "whatsapp",
    externalId: "wa_evt_seed_2",
    payload: {
      organizationId: "org_1",
      eventId: "evt_seed_wa_2",
      external_id: "wa_evt_seed_2",
      conversationExternalId: "wa_conv_881",
      senderExternalId: "wa_lead_10",
      senderName: "Mateo C.",
      body: "force_fail timeout proveedor",
    },
  });
}
