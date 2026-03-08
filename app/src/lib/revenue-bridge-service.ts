import { crmService, type Deal, type DealStage } from "@/lib/crm-service";
import { getPersistenceState } from "@/lib/in-memory-persistence";

type BridgeProvider = "calendly" | "stripe";
type BridgeStatus = "processed" | "ignored" | "failed";

export interface CalendlyBookingEvent {
  id: string;
  inviteeEmail: string;
  inviteeName?: string;
  dealId?: string;
  organizationId?: string;
  scheduledAt?: string;
  raw?: Record<string, unknown>;
}

export interface StripePaymentEvent {
  id: string;
  customerEmail?: string;
  customerName?: string;
  amount?: number;
  currency?: string;
  dealId?: string;
  organizationId?: string;
  paymentIntentId?: string;
  raw?: Record<string, unknown>;
}

export interface DealTransitionMappingInput {
  provider: BridgeProvider;
  organizationId: string;
  externalEventId: string;
  dealId?: string;
  leadEmail?: string;
  targetStage: DealStage;
}

export interface BridgeProcessResult {
  status: BridgeStatus;
  provider: BridgeProvider;
  externalEventId: string;
  message: string;
  dealId?: string;
  transitionApplied: boolean;
}

export interface RevenueBridgeSnapshot {
  lastCalendlyEvents: Array<{ id: string; status: BridgeStatus; processedAt: string; message: string }>;
  lastStripeEvents: Array<{ id: string; status: BridgeStatus; processedAt: string; message: string }>;
  transitionsApplied: Array<{
    dealId: string;
    fromStage: string;
    toStage: string;
    sourceProvider: BridgeProvider;
    externalEventId: string;
    createdAt: string;
  }>;
  failedCount: number;
  ignoredCount: number;
}

export const revenueBridgeService = {
  async processCalendlyBooking(event: CalendlyBookingEvent): Promise<BridgeProcessResult> {
    return processEvent({
      provider: "calendly",
      externalEventId: event.id,
      payload: (event.raw ?? event) as Record<string, unknown>,
      organizationId: event.organizationId ?? "org_1",
      leadEmail: event.inviteeEmail,
      dealId: event.dealId,
      targetStage: "booked",
      reason: "Calendly booking confirmada",
      note: `Booking Calendly procesada (${event.id})${event.scheduledAt ? ` · ${event.scheduledAt}` : ""}.`,
    });
  },

  async processStripePayment(event: StripePaymentEvent): Promise<BridgeProcessResult> {
    return processEvent({
      provider: "stripe",
      externalEventId: event.id,
      payload: (event.raw ?? event) as Record<string, unknown>,
      organizationId: event.organizationId ?? "org_1",
      leadEmail: event.customerEmail,
      dealId: event.dealId,
      targetStage: "won",
      reason: "Pago Stripe confirmado",
      note: `Pago Stripe registrado (${event.id})${event.amount ? ` · ${event.amount} ${event.currency ?? ""}`.trim() : ""}.`,
    });
  },

  async mapToDealTransition(input: DealTransitionMappingInput): Promise<Deal | null> {
    const deal = await resolveDeal(input.organizationId, input.dealId, input.leadEmail);
    if (!deal) return null;

    if (deal.stage === input.targetStage) {
      return deal;
    }

    return crmService.updateDealStage({
      organizationId: input.organizationId,
      dealId: deal.id,
      nextStage: input.targetStage,
      changedByUserId: "system_revenue_bridge",
      reason: `Bridge ${input.provider}`,
      note: `Transición aplicada por ${input.provider} (${input.externalEventId}).`,
    });
  },

  getOperationalSnapshot(limit = 6): RevenueBridgeSnapshot {
    const db = getPersistenceState();
    const ordered = [...db.integrationEventLog].sort((a, b) => +new Date(b.processedAt) - +new Date(a.processedAt));

    const mapEvent = (item: (typeof ordered)[number]) => ({
      id: item.externalEventId,
      status: item.status,
      processedAt: item.processedAt,
      message: item.error ? item.error : "Procesado",
    });

    return {
      lastCalendlyEvents: ordered.filter((item) => item.provider === "calendly").slice(0, limit).map(mapEvent),
      lastStripeEvents: ordered.filter((item) => item.provider === "stripe").slice(0, limit).map(mapEvent),
      transitionsApplied: [...db.bridgeTransitions]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, limit),
      failedCount: db.integrationEventLog.filter((item) => item.status === "failed").length,
      ignoredCount: db.integrationEventLog.filter((item) => item.status === "ignored").length,
    };
  },
};

async function processEvent(input: {
  provider: BridgeProvider;
  externalEventId: string;
  payload: Record<string, unknown>;
  organizationId: string;
  leadEmail?: string;
  dealId?: string;
  targetStage: DealStage;
  reason: string;
  note: string;
}): Promise<BridgeProcessResult> {
  const db = getPersistenceState();

  const alreadyProcessed = db.integrationEventLog.find(
    (item) => item.provider === input.provider && item.externalEventId === input.externalEventId,
  );

  if (alreadyProcessed) {
    return {
      status: "ignored",
      provider: input.provider,
      externalEventId: input.externalEventId,
      message: "Evento duplicado (idempotente)",
      transitionApplied: false,
    };
  }

  const deal = await resolveDeal(input.organizationId, input.dealId, input.leadEmail);

  if (!deal) {
    logEvent(input.provider, input.externalEventId, "ignored", input.payload, "No se encontró deal para el evento");
    return {
      status: "ignored",
      provider: input.provider,
      externalEventId: input.externalEventId,
      message: "No se encontró deal para el evento",
      transitionApplied: false,
    };
  }

  try {
    const updated =
      deal.stage === input.targetStage
        ? deal
        : await crmService.updateDealStage({
            organizationId: input.organizationId,
            dealId: deal.id,
            nextStage: input.targetStage,
            changedByUserId: "system_revenue_bridge",
            reason: input.reason,
            note: input.note,
          });

    if (!updated) {
      throw new Error("No se pudo aplicar la transición de etapa");
    }

    await crmService.upsertDealNote({
      organizationId: input.organizationId,
      dealId: deal.id,
      note: `[Revenue Bridge] ${input.note}`,
    });

    if (deal.stage !== updated.stage) {
      db.bridgeTransitions.push({
        id: `bridge_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        dealId: deal.id,
        fromStage: deal.stage,
        toStage: updated.stage,
        sourceProvider: input.provider,
        externalEventId: input.externalEventId,
        createdAt: new Date().toISOString(),
      });
    }

    logEvent(input.provider, input.externalEventId, "processed", input.payload, null);

    return {
      status: "processed",
      provider: input.provider,
      externalEventId: input.externalEventId,
      message: deal.stage === updated.stage ? "Sin cambios de etapa" : `Deal movido a ${updated.stage}`,
      dealId: deal.id,
      transitionApplied: deal.stage !== updated.stage,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    logEvent(input.provider, input.externalEventId, "failed", input.payload, errorMessage);

    return {
      status: "failed",
      provider: input.provider,
      externalEventId: input.externalEventId,
      message: errorMessage,
      dealId: deal.id,
      transitionApplied: false,
    };
  }
}

function logEvent(
  provider: BridgeProvider,
  externalEventId: string,
  status: BridgeStatus,
  payload: Record<string, unknown>,
  error: string | null,
) {
  const db = getPersistenceState();
  db.integrationEventLog.push({
    id: `iev_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    provider,
    externalEventId,
    status,
    payload,
    processedAt: new Date().toISOString(),
    error,
  });
}

async function resolveDeal(organizationId: string, dealId?: string, leadEmail?: string): Promise<Deal | null> {
  const deals = await crmService.listDeals(organizationId);

  if (dealId) {
    return deals.find((item) => item.id === dealId) ?? null;
  }

  if (leadEmail) {
    return deals.find((item) => item.leadProfile.email.toLowerCase() === leadEmail.toLowerCase()) ?? null;
  }

  return null;
}
