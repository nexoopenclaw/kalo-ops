import { createHmac, timingSafeEqual } from "node:crypto";
import { fail, ok } from "@/lib/api-response";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getRequestId, logger } from "@/lib/logger";
import { processRevenueWebhookThroughAdapter } from "@/lib/provider-runtime";

function verifyStripeSignaturePlaceholder(rawBody: string, signatureHeader: string | null): boolean {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !signatureHeader) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(signatureHeader.trim());
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const limit = checkRateLimit({ key: getClientKey(request, "webhook_stripe"), limit: 60, windowMs: 60_000 });
  if (!limit.allowed) return fail({ code: "RATE_LIMITED", message: "Demasiados webhooks Stripe" }, 429);

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const mockSignature = request.headers.get("x-kalo-mock-signature");

  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const mockValid = mockSignature === "dev-ok";

  if (!hasWebhookSecret && !mockValid) {
    return fail({ code: "NOT_CONFIGURED", message: "Stripe webhook secret no configurado. Usa x-kalo-mock-signature: dev-ok para entorno mock." }, 503);
  }
  if (hasWebhookSecret && !verifyStripeSignaturePlaceholder(rawBody, signature)) {
    return fail({ code: "INVALID_SIGNATURE", message: "Firma inválida para webhook Stripe" }, 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return fail({ code: "INVALID_JSON", message: "Payload JSON inválido" }, 400);
  }

  const result = await processRevenueWebhookThroughAdapter({ adapterId: "stripe", payload, requestId });
  logger.info("Stripe webhook processed", { requestId, route: "/api/webhooks/stripe" });
  return ok(result, 200, { requestId });
}
