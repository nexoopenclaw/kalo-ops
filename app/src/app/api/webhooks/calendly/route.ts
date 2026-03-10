import { createHmac, timingSafeEqual } from "node:crypto";
import { fail, ok } from "@/lib/api-response";
import { getRequestId, logger } from "@/lib/logger";
import { processRevenueWebhookThroughAdapter } from "@/lib/provider-runtime";

function verifyCalendlySignature(rawBody: string, signatureHeader: string | null): boolean {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!signingKey || !signatureHeader) return false;
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
    return fail({ code: "NOT_CONFIGURED", message: "Calendly webhook signing key no configurada. Usa x-kalo-mock-signature: dev-ok para entorno mock." }, 503);
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

  const result = await processRevenueWebhookThroughAdapter({ adapterId: "calendly", payload, requestId });
  logger.info("Calendly webhook processed", { requestId, route: "/api/webhooks/calendly" });
  return ok(result, 200, { requestId });
}
