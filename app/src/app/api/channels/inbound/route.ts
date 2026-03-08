import { fail, ok } from "@/lib/api-response";
import { channelDispatcher, type SupportedChannel } from "@/lib/channel-adapters";

interface InboundBody {
  channel?: SupportedChannel;
  payload?: unknown;
}

export async function POST(request: Request) {
  let body: InboundBody;

  try {
    body = (await request.json()) as InboundBody;
  } catch {
    return fail({ code: "BAD_JSON", message: "JSON inválido en el body" }, 400);
  }

  const channel = body.channel;
  if (!channel || !["instagram", "whatsapp", "email"].includes(channel)) {
    return fail({ code: "VALIDATION_ERROR", message: "channel debe ser instagram, whatsapp o email" }, 400);
  }

  const normalized = channelDispatcher.normalizeInbound(channel, body.payload ?? {});

  return ok(
    {
      envelope: normalized,
      todo: "Persistir envelope en public.channel_events y enlazar conversación en pipeline productivo.",
    },
    200,
  );
}
