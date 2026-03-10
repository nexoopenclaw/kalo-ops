import { fail, ok } from "@/lib/api-response";
import { channelDispatcher, type OutboundMessageType, type SupportedChannel } from "@/lib/channel-adapters";
import { featureFlags } from "@/lib/feature-flags";
import { outboundSafeguards } from "@/lib/outbound-safeguards";

interface SendBody {
  organizationId?: string;
  channel?: SupportedChannel;
  conversationId?: string;
  leadId?: string;
  to?: string;
  body?: string;
  messageType?: OutboundMessageType;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

export async function POST(request: Request) {
  let payload: SendBody;

  try {
    payload = (await request.json()) as SendBody;
  } catch {
    return fail({ code: "BAD_JSON", message: "JSON inválido en el body" }, 400);
  }

  const organizationId = String(payload.organizationId ?? "org_1").trim();
  const channel = payload.channel;
  const conversationId = String(payload.conversationId ?? "").trim();
  const leadId = String(payload.leadId ?? "").trim();
  const to = String(payload.to ?? "").trim();
  const body = String(payload.body ?? "").trim();

  if (!channel || !["instagram", "whatsapp", "email"].includes(channel)) {
    return fail({ code: "VALIDATION_ERROR", message: "channel debe ser instagram, whatsapp o email" }, 400);
  }

  if (!conversationId || !leadId || !to || !body) {
    return fail({ code: "VALIDATION_ERROR", message: "conversationId, leadId, to y body son obligatorios" }, 400);
  }

  const idempotencyKey = String(payload.idempotencyKey ?? "").trim();
  const requestHash = outboundSafeguards.hashRequest({ channel, conversationId, leadId, to, body, messageType: payload.messageType ?? "text" });
  if (idempotencyKey) {
    const cached = outboundSafeguards.findIdempotent(organizationId, idempotencyKey, "channels_send", requestHash);
    if (cached) return ok({ organizationId, deduplicated: true, dispatch: cached.response }, 200);
  }

  const forcedDryRun = outboundSafeguards.getGlobalDryRun(organizationId);
  if (!featureFlags.isEnabled("outbound_sends_live") || forcedDryRun) {
    const response = { organizationId, mode: "mock", status: "queued", reason: forcedDryRun ? "Global dry-run enabled for organization" : "Feature flag outbound_sends_live disabled" };
    if (idempotencyKey) outboundSafeguards.storeIdempotent(organizationId, idempotencyKey, "channels_send", requestHash, response as unknown as Record<string, unknown>);
    return ok(response, 202);
  }

  const result = await channelDispatcher.send({
    organizationId,
    channel,
    conversationId,
    leadId,
    to,
    body,
    messageType: payload.messageType ?? "text",
    metadata: payload.metadata,
  });

  const response = {
    organizationId,
    dispatch: result,
    todo: "Configurar credenciales reales del proveedor (SDK/API) en variables seguras de entorno.",
  };
  if (idempotencyKey) outboundSafeguards.storeIdempotent(organizationId, idempotencyKey, "channels_send", requestHash, response as unknown as Record<string, unknown>);

  return ok(response, 202);
}
