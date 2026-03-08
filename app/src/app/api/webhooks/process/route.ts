import { fail, ok } from "@/lib/api-response";
import { processWebhook } from "@/lib/webhook-engine";
import type { SupportedChannel } from "@/lib/channel-adapters";

interface ProcessBody {
  organizationId?: string;
  channel?: SupportedChannel;
  payload?: unknown;
  externalId?: string;
  maxRetries?: number;
}

const SUPPORTED_CHANNELS: SupportedChannel[] = ["instagram", "whatsapp", "email"];

export async function POST(request: Request) {
  let body: ProcessBody;

  try {
    body = (await request.json()) as ProcessBody;
  } catch {
    return fail({ code: "BAD_JSON", message: "JSON inválido en el body" }, 400);
  }

  const organizationId = String(body.organizationId ?? "org_1").trim();
  const channel = body.channel;

  if (!channel || !SUPPORTED_CHANNELS.includes(channel)) {
    return fail({ code: "VALIDATION_ERROR", message: "channel debe ser instagram, whatsapp o email" }, 400);
  }

  if (!body.payload) {
    return fail({ code: "VALIDATION_ERROR", message: "payload es obligatorio" }, 400);
  }

  const maxRetries = Number(body.maxRetries ?? 3);
  if (!Number.isFinite(maxRetries) || maxRetries < 1 || maxRetries > 10) {
    return fail({ code: "VALIDATION_ERROR", message: "maxRetries debe estar entre 1 y 10" }, 400);
  }

  const result = await processWebhook({
    organizationId,
    channel,
    payload: body.payload,
    externalId: body.externalId,
    maxRetries,
  });

  return ok(result, result.idempotencyHit ? 200 : 202);
}
