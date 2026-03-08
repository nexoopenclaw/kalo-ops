import { createHmac, timingSafeEqual } from "node:crypto";
import { fail, ok } from "@/lib/api-response";
import { revenueBridgeService, type StripePaymentEvent } from "@/lib/revenue-bridge-service";

type StripeWebhookPayload = {
  id?: string;
  type?: string;
  data?: {
    object?: {
      id?: string;
      metadata?: Record<string, string>;
      customer_email?: string;
      receipt_email?: string;
      amount_received?: number;
      currency?: string;
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
};

function verifyStripeSignaturePlaceholder(rawBody: string, signatureHeader: string | null): boolean {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return false;
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(signatureHeader.trim());

  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

function parseStripePayment(payload: StripeWebhookPayload): StripePaymentEvent | null {
  if (payload.type !== "payment_intent.succeeded" && payload.type !== "checkout.session.completed") {
    return null;
  }

  const object = payload.data?.object;
  if (!object) return null;

  const externalId = String(payload.id ?? object.id ?? "").trim();
  if (!externalId) return null;

  const email = object.customer_email ?? object.receipt_email ?? object.metadata?.email;

  return {
    id: externalId,
    customerEmail: email,
    amount: typeof object.amount_received === "number" ? object.amount_received / 100 : undefined,
    currency: object.currency?.toUpperCase(),
    dealId: object.metadata?.deal_id,
    paymentIntentId: object.id,
    organizationId: "org_1",
    raw: payload as Record<string, unknown>,
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const mockSignature = request.headers.get("x-kalo-mock-signature");

  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const mockValid = mockSignature === "dev-ok";

  if (!hasWebhookSecret && !mockValid) {
    return fail(
      {
        code: "NOT_CONFIGURED",
        message: "Stripe webhook secret no configurado. Usa x-kalo-mock-signature: dev-ok para entorno mock.",
      },
      503,
    );
  }

  if (hasWebhookSecret && !verifyStripeSignaturePlaceholder(rawBody, signature)) {
    return fail({ code: "INVALID_SIGNATURE", message: "Firma inválida para webhook Stripe" }, 401);
  }

  let payload: StripeWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as StripeWebhookPayload;
  } catch {
    return fail({ code: "INVALID_JSON", message: "Payload JSON inválido" }, 400);
  }

  const paymentEvent = parseStripePayment(payload);
  if (!paymentEvent) {
    return ok({ status: "ignored", reason: "Evento Stripe no mapeado a transición revenue bridge" });
  }

  if (!paymentEvent.customerEmail && !paymentEvent.dealId) {
    return ok({ status: "ignored", reason: "Evento Stripe sin deal_id ni email para resolver deal" });
  }

  const result = await revenueBridgeService.processStripePayment(paymentEvent);
  return ok(result);
}
