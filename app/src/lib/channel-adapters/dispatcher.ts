import { emailAdapter } from "./email-adapter";
import { instagramAdapter } from "./instagram-adapter";
import { whatsappAdapter } from "./whatsapp-adapter";
import type { AdapterHealth, ChannelAdapter, InboundEnvelope, OutboundDispatchResult, OutboundMessageInput, SupportedChannel } from "./types";

const adapters: Record<SupportedChannel, ChannelAdapter> = {
  instagram: instagramAdapter,
  whatsapp: whatsappAdapter,
  email: emailAdapter,
};

function getAdapter(channel: SupportedChannel): ChannelAdapter {
  return adapters[channel];
}

export const channelDispatcher = {
  async send(input: OutboundMessageInput): Promise<OutboundDispatchResult> {
    return getAdapter(input.channel).sendOutbound(input);
  },

  normalizeInbound(channel: SupportedChannel, raw: unknown): InboundEnvelope {
    return getAdapter(channel).normalizeInbound(raw);
  },

  async health(): Promise<AdapterHealth[]> {
    return Promise.all(Object.values(adapters).map((adapter) => adapter.health()));
  },

  async pause(channel: SupportedChannel): Promise<AdapterHealth> {
    return getAdapter(channel).pause();
  },

  async resume(channel: SupportedChannel): Promise<AdapterHealth> {
    return getAdapter(channel).resume();
  },

  async retryFailed(channel: SupportedChannel): Promise<{ channel: SupportedChannel; retried: number; at: string }> {
    return getAdapter(channel).retryFailed();
  },
};
