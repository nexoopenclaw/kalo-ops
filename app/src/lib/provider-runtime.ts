import { createHash, randomUUID } from "node:crypto";
import { getRuntimeConfig } from "@/lib/config";
import { processWebhook, type ProcessWebhookResult } from "@/lib/webhook-engine";
import { revenueBridgeService } from "@/lib/revenue-bridge-service";
import { validateCalendlyWebhook, validateStripeWebhook } from "@/lib/revenue-bridge-validation";

export type RuntimeAdapterId = "meta" | "whatsapp" | "email" | "stripe" | "calendly";
export type AdapterMode = "mock" | "live";
export type AdapterHealthState = "healthy" | "degraded" | "offline";

export interface ProviderCapabilities {
  inboundWebhook: boolean;
  outboundMessage: boolean;
  revenueEvent: boolean;
  replay: boolean;
  healthcheck: boolean;
}

export interface ProviderAdapterStatus {
  id: RuntimeAdapterId;
  label: string;
  mode: AdapterMode;
  health: AdapterHealthState;
  capabilities: ProviderCapabilities;
  lastError: string | null;
  updatedAt: string;
}

const ERROR_STATE: Partial<Record<RuntimeAdapterId, { message: string; at: string }>> = {};

function envMode(id: RuntimeAdapterId, isConfigured: boolean): AdapterMode {
  const envKey = `KALO_ADAPTER_MODE_${id.toUpperCase()}`;
  const fromEnv = process.env[envKey]?.toLowerCase();
  if (fromEnv === "mock" || fromEnv === "live") return fromEnv;
  return isConfigured ? "live" : "mock";
}

function getCapabilities(id: RuntimeAdapterId): ProviderCapabilities {
  switch (id) {
    case "meta":
    case "whatsapp":
      return { inboundWebhook: true, outboundMessage: true, revenueEvent: false, replay: true, healthcheck: true };
    case "email":
      return { inboundWebhook: true, outboundMessage: true, revenueEvent: false, replay: true, healthcheck: true };
    case "stripe":
    case "calendly":
      return { inboundWebhook: true, outboundMessage: false, revenueEvent: true, replay: true, healthcheck: true };
  }
}

function getStatus(id: RuntimeAdapterId): ProviderAdapterStatus {
  const cfg = getRuntimeConfig();
  const mapped = id === "whatsapp" ? cfg.providers.meta : cfg.providers[id as "meta" | "email" | "stripe" | "calendly"];
  const mode = envMode(id, mapped.isConfigured);
  const lastError = ERROR_STATE[id]?.message ?? null;

  return {
    id,
    label:
      id === "meta"
        ? "Meta (Instagram)"
        : id === "whatsapp"
          ? "WhatsApp (Meta Cloud API)"
          : id === "email"
            ? "Email"
            : id === "stripe"
              ? "Stripe"
              : "Calendly",
    mode,
    health: lastError ? "degraded" : mode === "live" && mapped.isConfigured ? "healthy" : "offline",
    capabilities: getCapabilities(id),
    lastError,
    updatedAt: ERROR_STATE[id]?.at ?? new Date().toISOString(),
  };
}

function reportAdapterError(id: RuntimeAdapterId, message: string) {
  ERROR_STATE[id] = { message, at: new Date().toISOString() };
}

function clearAdapterError(id: RuntimeAdapterId) {
  delete ERROR_STATE[id];
}

export function listProviderAdapterStatus(): ProviderAdapterStatus[] {
  return ["meta", "whatsapp", "email", "stripe", "calendly"].map((id) => getStatus(id as RuntimeAdapterId));
}

export async function dispatchOutboundViaAdapter(input: {
  adapterId: "meta" | "whatsapp" | "email";
  channel: "instagram" | "whatsapp" | "email";
  organizationId: string;
  conversationId: string;
  leadId: string;
  to: string;
  body: string;
}) {
  const status = getStatus(input.adapterId);
  if (status.mode === "mock") {
    return {
      adapter: input.adapterId,
      mode: "mock" as const,
      status: "queued" as const,
      externalMessageId: `mock_${Date.now()}`,
      queuedAt: new Date().toISOString(),
    };
  }

  clearAdapterError(input.adapterId);
  return {
    adapter: input.adapterId,
    mode: "live" as const,
    status: "sent" as const,
    externalMessageId: `live_${randomUUID().slice(0, 8)}`,
    queuedAt: new Date().toISOString(),
  };
}

export async function processMetaWebhookThroughAdapter(rawPayload: unknown): Promise<{ receivedEvents: number; processed: ProcessWebhookResult[] }> {
  const payload = (rawPayload ?? {}) as { entry?: Array<{ id?: string; time?: number; changes?: Array<{ value?: { messages?: unknown[]; statuses?: unknown[] } }> }> };
  const events = (payload.entry ?? []).flatMap((entry) =>
    (entry.changes ?? []).flatMap((change) => {
      const messages = change.value?.messages ?? [];
      const statuses = change.value?.statuses ?? [];
      return [...messages, ...statuses].map((item, idx) => ({ entryId: entry.id ?? "unknown", timestamp: entry.time ?? Date.now(), body: JSON.stringify(item), idx }));
    }),
  );

  const processed = await Promise.all(
    events.map((event, index) =>
      processWebhook({
        organizationId: "org_1",
        channel: "instagram",
        externalId: `${event.entryId}_${event.idx}_${index}`,
        payload: {
          organizationId: "org_1",
          eventId: `${event.entryId}_${event.timestamp}_${index}`,
          external_id: `${event.entryId}_${event.idx}_${index}`,
          occurredAt: new Date(event.timestamp).toISOString(),
          conversationExternalId: event.entryId,
          senderExternalId: "meta_webhook",
          senderName: "Meta webhook",
          body: event.body,
        },
      }),
    ),
  );

  return { receivedEvents: events.length, processed };
}

export async function processRevenueWebhookThroughAdapter(input: {
  adapterId: "stripe" | "calendly";
  payload: unknown;
  requestId?: string;
}) {
  if (input.adapterId === "stripe") {
    const parsed = validateStripeWebhook(input.payload);
    if (!parsed.ok) return { status: "ignored", reason: parsed.message, deadLetterReason: parsed.reason };
    if (!parsed.data.customerEmail && !parsed.data.dealId) return { status: "ignored", reason: "Evento Stripe sin deal_id ni email para resolver deal" };
    try {
      const result = await revenueBridgeService.processStripePayment({ ...parsed.data, organizationId: "org_1" }, input.requestId);
      clearAdapterError("stripe");
      return result;
    } catch (error) {
      reportAdapterError("stripe", error instanceof Error ? error.message : "Error desconocido");
      throw error;
    }
  }

  const parsed = validateCalendlyWebhook(input.payload);
  if (!parsed.ok) return { status: "ignored", reason: parsed.message, deadLetterReason: parsed.reason };
  try {
    const result = await revenueBridgeService.processCalendlyBooking({ ...parsed.data, organizationId: "org_1" }, input.requestId);
    clearAdapterError("calendly");
    return result;
  } catch (error) {
    reportAdapterError("calendly", error instanceof Error ? error.message : "Error desconocido");
    throw error;
  }
}

export function deterministicReplayHash(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input ?? {})).digest("hex").slice(0, 16);
}
