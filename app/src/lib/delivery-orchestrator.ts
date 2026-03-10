import { randomUUID } from "node:crypto";
import { dispatchOutboundViaAdapter } from "@/lib/provider-runtime";
import { featureFlags } from "@/lib/feature-flags";
import { outboundSafeguards } from "@/lib/outbound-safeguards";

export type DeliveryChannel = "email" | "whatsapp" | "slack";
export type DeliveryStatus = "queued" | "sent" | "retrying" | "failed";

export interface DeliveryAttempt {
  id: string;
  organizationId: string;
  channel: DeliveryChannel;
  recipient: string;
  message: string;
  status: DeliveryStatus;
  mode: "mock" | "live";
  provider: string;
  attempt: number;
  maxAttempts: number;
  retryAt: string | null;
  correlationId: string;
  externalMessageId: string | null;
  error: string | null;
  idempotencyKey?: string;
  deduplicated?: boolean;
  createdAt: string;
  updatedAt: string;
}

const globalKey = "__kaloOpsDeliveryAttempts__";

function store(): DeliveryAttempt[] {
  const scoped = globalThis as typeof globalThis & { [globalKey]?: DeliveryAttempt[] };
  if (!scoped[globalKey]) scoped[globalKey] = [];
  return scoped[globalKey] as DeliveryAttempt[];
}

function providerFor(channel: DeliveryChannel) {
  return channel === "slack" ? "slack" : channel;
}

export const deliveryOrchestrator = {
  async sendTest(input: {
    organizationId: string;
    channel: DeliveryChannel;
    recipient: string;
    message: string;
    maxAttempts?: number;
    forceFail?: boolean;
    idempotencyKey?: string;
  }) {
    const now = new Date().toISOString();
    const maxAttempts = Math.max(1, Math.min(5, Number(input.maxAttempts ?? 3)));
    const requestHash = outboundSafeguards.hashRequest({
      channel: input.channel,
      recipient: input.recipient,
      message: input.message,
      maxAttempts,
      forceFail: Boolean(input.forceFail),
    });

    if (input.idempotencyKey) {
      const cached = outboundSafeguards.findIdempotent(input.organizationId, input.idempotencyKey, "delivery_send_test", requestHash);
      if (cached) {
        const deduped = cached.response as unknown as DeliveryAttempt;
        return { ...deduped, deduplicated: true };
      }
    }

    const mode: "mock" | "live" = featureFlags.isEnabled("outbound_sends_live") && !outboundSafeguards.getGlobalDryRun(input.organizationId) ? "live" : "mock";

    const attemptRecord: DeliveryAttempt = {
      id: `datt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      organizationId: input.organizationId,
      channel: input.channel,
      recipient: input.recipient,
      message: input.message,
      status: "queued",
      mode,
      provider: providerFor(input.channel),
      attempt: 1,
      maxAttempts,
      retryAt: null,
      correlationId: randomUUID(),
      externalMessageId: null,
      error: null,
      idempotencyKey: input.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };

    try {
      if (input.forceFail) throw new Error("Forced failure for retry policy validation");

      if (input.channel === "slack") {
        attemptRecord.status = mode === "live" ? "sent" : "queued";
        attemptRecord.externalMessageId = `${mode}_sl_${Date.now()}`;
      } else {
        const res = await dispatchOutboundViaAdapter({
          adapterId: input.channel,
          channel: input.channel,
          organizationId: input.organizationId,
          conversationId: `delivery_${Date.now()}`,
          leadId: "delivery_test",
          to: input.recipient,
          body: input.message,
        });
        attemptRecord.status = res.status;
        attemptRecord.mode = res.mode;
        attemptRecord.externalMessageId = res.externalMessageId ?? null;
      }
    } catch (error) {
      attemptRecord.error = error instanceof Error ? error.message : "Unexpected error";
      attemptRecord.status = maxAttempts > 1 ? "retrying" : "failed";
      attemptRecord.retryAt = maxAttempts > 1 ? new Date(Date.now() + 60_000).toISOString() : null;
    }

    attemptRecord.updatedAt = new Date().toISOString();
    store().unshift(attemptRecord);
    if (input.idempotencyKey) outboundSafeguards.storeIdempotent(input.organizationId, input.idempotencyKey, "delivery_send_test", requestHash, attemptRecord as unknown as Record<string, unknown>);
    return attemptRecord;
  },

  history(organizationId: string, limit = 50): DeliveryAttempt[] {
    return store().filter((item) => item.organizationId === organizationId).slice(0, limit).map((item) => ({ ...item }));
  },
};
