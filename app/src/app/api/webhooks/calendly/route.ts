import { createHmac, timingSafeEqual } from "node:crypto";
import { fail, ok } from "@/lib/api-response";
import { revenueBridgeService, type CalendlyBookingEvent } from "@/lib/revenue-bridge-service";

type CalendlyWebhookPayload = {
  event?: string;
  created_at?: string;
  payload?: {
    event?: { uri?: string; start_time?: string };
    invitee?: { uri?: string; email?: string; name?: string };
    questions_and_answers?: Array<{ question?: string; answer?: string }>;
    tracking?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

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

function parseBookingEvent(payload: CalendlyWebhookPayload): CalendlyBookingEvent | null {
  const eventId = String(payload.payload?.invitee?.uri ?? payload.payload?.event?.uri ?? "").trim();
  const inviteeEmail = String(payload.payload?.invitee?.email ?? "").trim();

  if (!eventId || !inviteeEmail) return null;

  const dealIdAnswer = payload.payload?.questions_and_answers?.find((item) =>
    (item.question ?? "").toLowerCase().includes("deal_id"),
  )?.answer;

  return {
    id: eventId,
    inviteeEmail,
    inviteeName: payload.payload?.invitee?.name,
    dealId: typeof dealIdAnswer === "string" ? dealIdAnswer : undefined,
    organizationId: "org_1",
    scheduledAt: payload.payload?.event?.start_time,
    raw: payload as Record<string, unknown>,
  };
}

export async function POST(request: Request) {
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

  let payload: CalendlyWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as CalendlyWebhookPayload;
  } catch {
    return fail({ code: "INVALID_JSON", message: "Payload JSON inválido" }, 400);
  }

  const bookingEvent = parseBookingEvent(payload);
  if (!bookingEvent) {
    return ok({ status: "ignored", reason: "Evento sin datos mínimos para bridge" });
  }

  const result = await revenueBridgeService.processCalendlyBooking(bookingEvent);
  return ok(result);
}
