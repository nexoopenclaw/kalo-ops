import { getAdapterState, updateAdapterState } from "./mock-state";
import type { ChannelAdapter, InboundEnvelope, OutboundDispatchResult, OutboundMessageInput } from "./types";

export const whatsappAdapter: ChannelAdapter = {
  channel: "whatsapp",

  async sendOutbound(input: OutboundMessageInput): Promise<OutboundDispatchResult> {
    const adapterState = getAdapterState("whatsapp");
    if (adapterState.state === "paused") {
      return {
        adapter: "whatsapp",
        status: "failed",
        queuedAt: new Date().toISOString(),
        error: "Adapter pausado",
      };
    }

    updateAdapterState("whatsapp", { queueDepth: Math.max(0, adapterState.queueDepth + 1) });
    // TODO(provider-sdk): integrar WhatsApp Business API con phone_number_id y token de sistema.
    return {
      adapter: "whatsapp",
      status: "queued",
      externalMessageId: `wa_${input.conversationId}_${Date.now()}`,
      queuedAt: new Date().toISOString(),
    };
  },

  normalizeInbound(raw: unknown): InboundEnvelope {
    const payload = (raw ?? {}) as Record<string, unknown>;

    return {
      organizationId: String(payload.organizationId ?? "org_1"),
      channel: "whatsapp",
      eventId: String(payload.eventId ?? `evt_wa_${Date.now()}`),
      occurredAt: String(payload.occurredAt ?? new Date().toISOString()),
      direction: "inbound",
      type: "text",
      conversationExternalId: String(payload.conversationExternalId ?? "wa_thread_mock"),
      senderExternalId: String(payload.senderExternalId ?? "wa_user_mock"),
      senderName: String(payload.senderName ?? "Lead WhatsApp"),
      body: String(payload.body ?? ""),
      metadata: { raw },
    };
  },

  async health() {
    return getAdapterState("whatsapp");
  },

  async pause() {
    return updateAdapterState("whatsapp", { state: "paused", detail: "Adapter pausado manualmente" });
  },

  async resume() {
    return updateAdapterState("whatsapp", { state: "healthy", detail: "Adapter reanudado" });
  },

  async retryFailed() {
    return { channel: "whatsapp", retried: 4, at: new Date().toISOString() };
  },
};
