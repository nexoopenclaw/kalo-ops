import { getAdapterState, updateAdapterState } from "./mock-state";
import type { ChannelAdapter, InboundEnvelope, OutboundDispatchResult, OutboundMessageInput } from "./types";

export const emailAdapter: ChannelAdapter = {
  channel: "email",

  async sendOutbound(input: OutboundMessageInput): Promise<OutboundDispatchResult> {
    const adapterState = getAdapterState("email");
    if (adapterState.state === "paused") {
      return {
        adapter: "email",
        status: "failed",
        queuedAt: new Date().toISOString(),
        error: "Adapter pausado",
      };
    }

    updateAdapterState("email", { queueDepth: Math.max(0, adapterState.queueDepth + 1) });
    // TODO(provider-sdk): integrar proveedor SMTP/API transaccional (Resend/SendGrid) con credenciales seguras.
    return {
      adapter: "email",
      status: "queued",
      externalMessageId: `em_${Date.now()}`,
      queuedAt: new Date().toISOString(),
    };
  },

  normalizeInbound(raw: unknown): InboundEnvelope {
    const payload = (raw ?? {}) as Record<string, unknown>;

    return {
      organizationId: String(payload.organizationId ?? "org_1"),
      channel: "email",
      eventId: String(payload.eventId ?? `evt_em_${Date.now()}`),
      occurredAt: String(payload.occurredAt ?? new Date().toISOString()),
      direction: "inbound",
      type: "text",
      conversationExternalId: String(payload.conversationExternalId ?? "email_thread_mock"),
      senderExternalId: String(payload.senderExternalId ?? "email_user_mock"),
      senderName: String(payload.senderName ?? "Lead Email"),
      body: String(payload.body ?? ""),
      metadata: { raw },
    };
  },

  async health() {
    return getAdapterState("email");
  },

  async pause() {
    return updateAdapterState("email", { state: "paused", detail: "Adapter pausado manualmente" });
  },

  async resume() {
    return updateAdapterState("email", { state: "healthy", detail: "Adapter reanudado" });
  },

  async retryFailed() {
    return { channel: "email", retried: 1, at: new Date().toISOString() };
  },
};
