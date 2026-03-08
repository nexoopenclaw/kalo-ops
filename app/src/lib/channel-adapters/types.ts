export type SupportedChannel = "instagram" | "whatsapp" | "email";

export type AdapterHealthState = "healthy" | "degraded" | "paused";

export type OutboundMessageType = "text" | "voice" | "image" | "system";

export interface OutboundMessageInput {
  organizationId: string;
  channel: SupportedChannel;
  conversationId: string;
  leadId: string;
  to: string;
  body: string;
  messageType?: OutboundMessageType;
  metadata?: Record<string, unknown>;
}

export interface OutboundDispatchResult {
  adapter: SupportedChannel;
  status: "queued" | "sent" | "failed";
  externalMessageId?: string;
  queuedAt: string;
  error?: string;
}

export interface InboundEnvelope {
  organizationId: string;
  channel: SupportedChannel;
  eventId: string;
  occurredAt: string;
  direction: "inbound";
  type: OutboundMessageType;
  conversationExternalId: string;
  senderExternalId: string;
  senderName?: string;
  body: string;
  attachments?: Array<{ type: "image" | "audio" | "file"; url: string }>;
  metadata?: Record<string, unknown>;
}

export interface AdapterHealth {
  channel: SupportedChannel;
  state: AdapterHealthState;
  latencyMs: number;
  queueDepth: number;
  lastSyncAt: string;
  detail: string;
}

export interface ChannelAdapter {
  channel: SupportedChannel;
  sendOutbound(input: OutboundMessageInput): Promise<OutboundDispatchResult>;
  normalizeInbound(raw: unknown): InboundEnvelope;
  health(): Promise<AdapterHealth>;
  pause(): Promise<AdapterHealth>;
  resume(): Promise<AdapterHealth>;
  retryFailed(): Promise<{ channel: SupportedChannel; retried: number; at: string }>;
}
