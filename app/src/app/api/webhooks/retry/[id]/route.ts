import { fail, ok } from "@/lib/api-response";
import { retryWebhookEvent } from "@/lib/webhook-engine";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_: Request, { params }: Params) {
  const { id } = await params;
  if (!id) {
    return fail({ code: "VALIDATION_ERROR", message: "id es obligatorio" }, 400);
  }

  const event = await retryWebhookEvent(id);
  if (!event) {
    return fail({ code: "NOT_FOUND", message: "Webhook event no encontrado" }, 404);
  }

  return ok({ event });
}
