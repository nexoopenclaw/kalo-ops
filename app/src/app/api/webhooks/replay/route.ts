import { fail, ok } from "@/lib/api-response";
import { replayWebhookEvent } from "@/lib/webhook-replay-service";

export async function POST(request: Request) {
  let payload: {
    eventId?: string;
    organizationId?: string;
    channel?: "instagram" | "whatsapp" | "email";
    payload?: unknown;
    dryRun?: boolean;
    maxRetries?: number;
  };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return fail({ code: "BAD_JSON", message: "JSON inválido" }, 400);
  }

  try {
    const data = await replayWebhookEvent(payload);
    return ok(data, 200);
  } catch (error) {
    return fail({ code: "REPLAY_ERROR", message: error instanceof Error ? error.message : "Error desconocido" }, 400);
  }
}
