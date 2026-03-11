import Stripe from "stripe";
import { fail, ok } from "@/lib/api-response";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getRequestId, logger } from "@/lib/logger";
import { processRevenueWebhookThroughAdapter } from "@/lib/provider-runtime";

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  // Stripe SDK requires a non-empty key string for instantiation.
  // Webhook verification only needs STRIPE_WEBHOOK_SECRET, but in prod we expect both.
  return new Stripe(key ?? "sk_test_placeholder", {
    apiVersion: "2024-06-20", // keep in sync with Stripe SDK supported versions
    typescript: true,
  });
}

function constructStripeEventOrFail(input: { rawBody: string; signatureHeader: string | null }) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return { ok: false as const, code: "NOT_CONFIGURED" as const, message: "STRIPE_WEBHOOK_SECRET no configurado." };
  }
  if (!input.signatureHeader) {
    return { ok: false as const, code: "INVALID_SIGNATURE" as const, message: "Falta header stripe-signature." };
  }

  try {
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(input.rawBody, input.signatureHeader, webhookSecret);
    return { ok: true as const, event };
  } catch (error) {
    return {
      ok: false as const,
      code: "INVALID_SIGNATURE" as const,
      message: error instanceof Error ? error.message : "Firma inválida para webhook Stripe.",
    };
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const limit = checkRateLimit({ key: getClientKey(request, "webhook_stripe"), limit: 60, windowMs: 60_000 });
  if (!limit.allowed) return fail({ code: "RATE_LIMITED", message: "Demasiados webhooks Stripe" }, 429);

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const mockSignature = request.headers.get("x-kalo-mock-signature");

  const mockValid = mockSignature === "dev-ok";

  // Production path: verify via Stripe SDK to support timestamped signatures + tolerance.
  // Dev/CI path: allow a deterministic bypass for local simulations.
  let payload: unknown;
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    const constructed = constructStripeEventOrFail({ rawBody, signatureHeader: signature });
    if (!constructed.ok) return fail({ code: constructed.code, message: constructed.message }, 401);
    payload = constructed.event;
  } else {
    if (!mockValid) {
      return fail(
        {
          code: "NOT_CONFIGURED",
          message: "Stripe webhook secret no configurado. Usa x-kalo-mock-signature: dev-ok para entorno mock.",
        },
        503,
      );
    }

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return fail({ code: "INVALID_JSON", message: "Payload JSON inválido" }, 400);
    }
  }

  const result = await processRevenueWebhookThroughAdapter({ adapterId: "stripe", payload, requestId });
  logger.info("Stripe webhook processed", { requestId, route: "/api/webhooks/stripe" });
  return ok(result, 200, { requestId });
}
