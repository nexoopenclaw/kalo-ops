export type BridgeProvider = "calendly" | "stripe";

export type DeadLetterReason =
  | "INVALID_PAYLOAD"
  | "DEAL_NOT_FOUND"
  | "IDEMPOTENCY_CONFLICT"
  | "TRANSITION_BLOCKED"
  | "CRM_UPDATE_FAILED"
  | "INTERNAL_ERROR";

export interface ValidationOk<T> {
  ok: true;
  data: T;
}

export interface ValidationFail {
  ok: false;
  reason: DeadLetterReason;
  message: string;
}

export type ValidationResult<T> = ValidationOk<T> | ValidationFail;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function validateCalendlyWebhook(payload: unknown): ValidationResult<{
  id: string;
  inviteeEmail: string;
  inviteeName?: string;
  dealId?: string;
  scheduledAt?: string;
  raw: Record<string, unknown>;
}> {
  const root = asRecord(payload);
  const nested = asRecord(root?.payload);
  const invitee = asRecord(nested?.invitee);
  const event = asRecord(nested?.event);

  const id = String(invitee?.uri ?? event?.uri ?? "").trim();
  const inviteeEmail = String(invitee?.email ?? "").trim().toLowerCase();

  if (!id || !inviteeEmail || !inviteeEmail.includes("@")) {
    return { ok: false, reason: "INVALID_PAYLOAD", message: "Calendly payload inválido: falta id o email del invitee." };
  }

  const qas = Array.isArray(nested?.questions_and_answers) ? nested.questions_and_answers : [];
  const dealIdAnswer = qas.find((item) => {
    const qa = asRecord(item);
    return String(qa?.question ?? "").toLowerCase().includes("deal_id");
  });

  return {
    ok: true,
    data: {
      id,
      inviteeEmail,
      inviteeName: typeof invitee?.name === "string" ? invitee.name : undefined,
      dealId: typeof asRecord(dealIdAnswer)?.answer === "string" ? String(asRecord(dealIdAnswer)?.answer).trim() : undefined,
      scheduledAt: typeof event?.start_time === "string" ? event.start_time : undefined,
      raw: root ?? {},
    },
  };
}

export function validateStripeWebhook(payload: unknown): ValidationResult<{
  id: string;
  type: string;
  customerEmail?: string;
  amount?: number;
  currency?: string;
  dealId?: string;
  paymentIntentId?: string;
  raw: Record<string, unknown>;
}> {
  const root = asRecord(payload);
  const type = String(root?.type ?? "").trim();
  if (!type) return { ok: false, reason: "INVALID_PAYLOAD", message: "Stripe payload inválido: falta type." };

  if (type !== "payment_intent.succeeded" && type !== "checkout.session.completed") {
    return { ok: false, reason: "INVALID_PAYLOAD", message: "Evento Stripe no soportado para revenue loop." };
  }

  const data = asRecord(root?.data);
  const object = asRecord(data?.object);
  const id = String(root?.id ?? object?.id ?? "").trim();
  if (!id) return { ok: false, reason: "INVALID_PAYLOAD", message: "Stripe payload inválido: falta id." };

  const metadata = asRecord(object?.metadata);
  const customerEmail = String(object?.customer_email ?? object?.receipt_email ?? metadata?.email ?? "").trim().toLowerCase();
  const amountRaw = object?.amount_received;
  const amount = typeof amountRaw === "number" ? amountRaw / 100 : undefined;

  return {
    ok: true,
    data: {
      id,
      type,
      customerEmail: customerEmail || undefined,
      amount,
      currency: typeof object?.currency === "string" ? object.currency.toUpperCase() : undefined,
      dealId: typeof metadata?.deal_id === "string" ? metadata.deal_id : undefined,
      paymentIntentId: typeof object?.id === "string" ? object.id : undefined,
      raw: root ?? {},
    },
  };
}

export function computeRevenueIdempotencyKey(input: {
  provider: BridgeProvider;
  organizationId: string;
  externalEventId: string;
}): string {
  return `${input.provider}:${input.organizationId}:${input.externalEventId}`.toLowerCase();
}
