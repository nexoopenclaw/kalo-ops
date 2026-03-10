import { createHmac, timingSafeEqual } from "node:crypto";
import { fail, ok } from "@/lib/api-response";
import { getRequestId, logger } from "@/lib/logger";
import { revenueBridgeService } from "@/lib/revenue-bridge-service";
import { validateCalendlyWebhook } from "@/lib/revenue-bridge-validation";

function verifyCalendlySignature(rawBody: string, signatureHeader: string | null): boolean {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!signingKey) return false;
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", signingKey).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(signatureHeader.trim());

  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const rawBody = await request.text();
  const signature = request.headers.get("calendly-webhook-signature");
  const mockSignature = request.headers.get("x-kalo-mock-signature");

  const hasSigningKey = Boolean(process.env.CALENDLY_WEBHOOK_SIGNING_KEY);
  const mockValid = mockSignature === "dev-ok";

  if (!hasSigningKey && !mockValid) {
    return fail(
      {
        code: "NOT_CONFIGURED",
        message: "Calendly webhook signing key no configurada. Usa x-kalo-mock-signature: dev-ok para entorno mock.",
      },
      503,
    );
  }

  if (hasSigningKey && !verifyCalendlySignature(rawBody, signature)) {
    return fail({ code: "INVALID_SIGNATURE", message: "Firma inválida para webhook Calendly" }, 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return fail({ code: "INVALID_JSON", message: "Payload JSON inválido" }, 400);
  }

  const parsed = validateCalendlyWebhook(payload);
  if (!parsed.ok) {
    logger.warn("Calendly webhook ignored", { requestId, route: "/api/webhooks/calendly", reason: parsed.reason });
    return ok({ status: "ignored", reason: parsed.message, deadLetterReason: parsed.reason });
  }

  const result = await revenueBridgeService.processCalendlyBooking(
    {
      ...parsed.data,
      organizationId: "org_1",
    },
    requestId,
  );

  logger.info("Calendly webhook processed", { requestId, route: "/api/webhooks/calendly", externalId: parsed.data.id });
  return ok(result, 200, { requestId });
}
