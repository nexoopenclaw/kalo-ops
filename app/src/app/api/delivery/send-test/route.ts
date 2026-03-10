import { fail, ok } from "@/lib/api-response";
import { deliveryOrchestrator, type DeliveryChannel } from "@/lib/delivery-orchestrator";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { organizationId?: string; channel?: DeliveryChannel; recipient?: string; message?: string; maxAttempts?: number; forceFail?: boolean }
    | null;

  if (!body?.channel || !["email", "whatsapp", "slack"].includes(body.channel)) {
    return fail({ code: "VALIDATION_ERROR", message: "channel must be email|whatsapp|slack" }, 400);
  }

  const recipient = String(body.recipient ?? "").trim();
  const message = String(body.message ?? "").trim();
  if (!recipient || !message) {
    return fail({ code: "VALIDATION_ERROR", message: "recipient and message are required" }, 400);
  }

  const result = await deliveryOrchestrator.sendTest({
    organizationId: String(body.organizationId ?? "org_1"),
    channel: body.channel,
    recipient,
    message,
    maxAttempts: body.maxAttempts,
    forceFail: Boolean(body.forceFail),
  });

  return ok(result, 202);
}
