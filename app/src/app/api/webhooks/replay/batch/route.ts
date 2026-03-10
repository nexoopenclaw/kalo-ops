import { fail, ok } from "@/lib/api-response";
import { replayWebhookBatch } from "@/lib/webhook-replay-service";

export async function POST(request: Request) {
  let payload: {
    items?: Array<{ eventId?: string; organizationId?: string; channel?: "instagram" | "whatsapp" | "email"; payload?: unknown }>;
    dryRun?: boolean;
  };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return fail({ code: "BAD_JSON", message: "JSON inválido" }, 400);
  }

  if (!payload.items || payload.items.length === 0) {
    return fail({ code: "VALIDATION_ERROR", message: "items es obligatorio" }, 400);
  }

  const data = await replayWebhookBatch({ items: payload.items, dryRun: payload.dryRun });
  return ok(data, 200);
}
