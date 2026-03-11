import { getAdapterState, updateAdapterState } from "./mock-state";
import type { ChannelAdapter, InboundEnvelope, OutboundDispatchResult, OutboundMessageInput } from "./types";

export const instagramAdapter: ChannelAdapter = {
  channel: "instagram",

  async sendOutbound(input: OutboundMessageInput): Promise<OutboundDispatchResult> {
    const adapterState = getAdapterState("instagram");
    if (adapterState.state === "paused") {
      return {
        adapter: "instagram",
        status: "failed",
        queuedAt: new Date().toISOString(),
        error: "Adapter pausado",
      };
    }

    updateAdapterState("instagram", { queueDepth: Math.max(0, adapterState.queueDepth + 1) });
    // TODO(provider-sdk): integrar Meta Graph API (IG Messaging) con page access token seguro.
    return {
      adapter: "instagram",
      status: "queued",
      externalMessageId: `ig_${input.conversationId}_${Date.now()}`, 
      queuedAt: new Date().toISOString(),
    };
  },

  normalizeInbound(raw: unknown): InboundEnvelope {
    const payload = (raw ?? {}) as Record<string, unknown>;

    return {
      organizationId: String(payload.organizationId ?? "org_1"),
      channel: "instagram",
      eventId: String(payload.eventId ?? `evt_ig_${Date.now()}`),
      occurredAt: String(payload.occurredAt ?? new Date().toISOString()),
      direction: "inbound",
      type: "text",
      conversationExternalId: String(payload.conversationExternalId ?? "ig_thread_mock"),
      senderExternalId: String(payload.senderExternalId ?? "ig_user_mock"),
      senderName: String(payload.senderName ?? "Lead Instagram"),
      body: String(payload.body ?? ""),
      metadata: { raw },
    };
  },

  async health() {
    return getAdapterState("instagram");
  },

  async pause() {
    return updateAdapterState("instagram", { state: "paused", detail: "Adapter pausado manualmente" });
  },

  async resume() {
    return updateAdapterState("instagram", { state: "healthy", detail: "Adapter reanudado" });
  },

  async retryFailed() {
    return { channel: "instagram", retried: 2, at: new Date().toISOString() };
  },
};
