import { fail, ok } from "@/lib/api-response";
import { getWebhookMetrics, listWebhookEvents } from "@/lib/webhook-engine";
import type { SupportedChannel } from "@/lib/channel-adapters";
import type { WebhookEventStatus } from "@/lib/in-memory-persistence";

const SUPPORTED_CHANNELS: SupportedChannel[] = ["instagram", "whatsapp", "email"];
const SUPPORTED_STATUS: WebhookEventStatus[] = ["processed", "retrying", "failed_permanent"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const channel = url.searchParams.get("channel");
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const search = url.searchParams.get("search");

  if (channel && !SUPPORTED_CHANNELS.includes(channel as SupportedChannel)) {
    return fail({ code: "VALIDATION_ERROR", message: "channel inválido" }, 400);
  }

  if (status && !SUPPORTED_STATUS.includes(status as WebhookEventStatus)) {
    return fail({ code: "VALIDATION_ERROR", message: "status inválido" }, 400);
  }

  const events = listWebhookEvents({
    channel: channel ? (channel as SupportedChannel) : undefined,
    status: status ? (status as WebhookEventStatus) : undefined,
    from: from ?? undefined,
    to: to ?? undefined,
    search: search ?? undefined,
  });

  return ok({ events, metrics: getWebhookMetrics() });
}
