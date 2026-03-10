import { fail, ok } from "@/lib/api-response";
import { channelDispatcher, type OutboundMessageType, type SupportedChannel } from "@/lib/channel-adapters";
import { featureFlags } from "@/lib/feature-flags";

interface SendBody {
  organizationId?: string;
  channel?: SupportedChannel;
  conversationId?: string;
  leadId?: string;
  to?: string;
  body?: string;
  messageType?: OutboundMessageType;
  metadata?: Record<string, unknown>;
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

  if (!featureFlags.isEnabled("outbound_sends_live")) {
    return ok({ organizationId, mode: "mock", status: "queued", reason: "Feature flag outbound_sends_live disabled" }, 202);
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

  return ok(
    {
      organizationId,
      dispatch: result,
      todo: "Configurar credenciales reales del proveedor (SDK/API) en variables seguras de entorno.",
    },
    202,
  );
}
