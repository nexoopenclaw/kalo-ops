import { crmService, type Deal, type DealStage } from "@/lib/crm-service";
import { getPersistenceState } from "@/lib/in-memory-persistence";
import { logger } from "@/lib/logger";
import {
  type BridgeProvider,
  computeRevenueIdempotencyKey,
  type DeadLetterReason,
} from "@/lib/revenue-bridge-validation";

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

export interface BridgeProcessResult {
  status: BridgeStatus;
  provider: BridgeProvider;
  externalEventId: string;
  message: string;
  dealId?: string;
  transitionApplied: boolean;
  correlationId?: string;
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

const STAGE_RANK: Record<DealStage, number> = {
  new: 1,
  qualified: 2,
  booked: 3,
  show: 4,
  won: 5,
  lost: 6,
};

export const revenueBridgeService = {
  async processCalendlyBooking(event: CalendlyBookingEvent, correlationId?: string): Promise<BridgeProcessResult> {
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
      correlationId,
    });
  },

  async processStripePayment(event: StripePaymentEvent, correlationId?: string): Promise<BridgeProcessResult> {
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
      correlationId,
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

  getDiagnostics(limit = 8) {
    const db = getPersistenceState();
    const byProvider = {
      calendly: db.integrationEventLog.filter((item) => item.provider === "calendly").length,
      stripe: db.integrationEventLog.filter((item) => item.provider === "stripe").length,
    };

    const latestFailuresByCategory = [...db.revenueBridgeDeadLetters]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, limit)
      .map((item) => ({
        provider: item.provider,
        externalEventId: item.externalEventId,
        reason: item.reason,
        details: item.details,
        createdAt: item.createdAt,
        correlationId: item.correlationId,
      }));

    return {
      totalEvents: db.integrationEventLog.length,
      processed: db.integrationEventLog.filter((item) => item.status === "processed").length,
      ignored: db.integrationEventLog.filter((item) => item.status === "ignored").length,
      failed: db.integrationEventLog.filter((item) => item.status === "failed").length,
      byProvider,
      latestFailuresByCategory,
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
  correlationId?: string;
}): Promise<BridgeProcessResult> {
  const db = getPersistenceState();
  const idempotencyKey = computeRevenueIdempotencyKey({
    provider: input.provider,
    organizationId: input.organizationId,
    externalEventId: input.externalEventId,
  });

  const alreadyProcessed = db.integrationEventLog.find((item) => item.idempotencyKey === idempotencyKey);
  if (alreadyProcessed) {
    const payloadChanged = JSON.stringify(alreadyProcessed.payload) !== JSON.stringify(input.payload);
    if (payloadChanged) {
      const message = "Conflicto de idempotencia: mismo evento con payload distinto";
      pushDeadLetter(input.provider, input.externalEventId, "IDEMPOTENCY_CONFLICT", message, input.correlationId);
      logEvent(input.provider, input.externalEventId, "failed", input.payload, message, {
        idempotencyKey,
        correlationId: input.correlationId,
        deadLetterReason: "IDEMPOTENCY_CONFLICT",
      });
      return {
        status: "failed",
        provider: input.provider,
        externalEventId: input.externalEventId,
        message,
        transitionApplied: false,
        correlationId: input.correlationId,
      };
    }

    return {
      status: "ignored",
      provider: input.provider,
      externalEventId: input.externalEventId,
      message: "Evento duplicado (idempotente)",
      transitionApplied: false,
      correlationId: input.correlationId,
    };
  }

  const deal = await resolveDeal(input.organizationId, input.dealId, input.leadEmail);

  if (!deal) {
    const message = "No se encontró deal para el evento";
    pushDeadLetter(input.provider, input.externalEventId, "DEAL_NOT_FOUND", message, input.correlationId);
    logEvent(input.provider, input.externalEventId, "ignored", input.payload, message, {
      idempotencyKey,
      correlationId: input.correlationId,
      deadLetterReason: "DEAL_NOT_FOUND",
    });
    return {
      status: "ignored",
      provider: input.provider,
      externalEventId: input.externalEventId,
      message,
      transitionApplied: false,
      correlationId: input.correlationId,
    };
  }

  if (!canTransition(deal.stage, input.targetStage)) {
    const message = `Regla de transición bloqueada: ${deal.stage} -> ${input.targetStage}`;
    pushDeadLetter(input.provider, input.externalEventId, "TRANSITION_BLOCKED", message, input.correlationId);
    logEvent(input.provider, input.externalEventId, "failed", input.payload, message, {
      idempotencyKey,
      correlationId: input.correlationId,
      deadLetterReason: "TRANSITION_BLOCKED",
    });
    return {
      status: "failed",
      provider: input.provider,
      externalEventId: input.externalEventId,
      message,
      dealId: deal.id,
      transitionApplied: false,
      correlationId: input.correlationId,
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

    logEvent(input.provider, input.externalEventId, "processed", input.payload, null, {
      idempotencyKey,
      correlationId: input.correlationId,
    });

    logger.info("Revenue bridge event processed", {
      correlationId: input.correlationId,
      provider: input.provider,
      externalEventId: input.externalEventId,
      dealId: deal.id,
      targetStage: input.targetStage,
    });

    return {
      status: "processed",
      provider: input.provider,
      externalEventId: input.externalEventId,
      message: deal.stage === updated.stage ? "Sin cambios de etapa" : `Deal movido a ${updated.stage}`,
      dealId: deal.id,
      transitionApplied: deal.stage !== updated.stage,
      correlationId: input.correlationId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    pushDeadLetter(input.provider, input.externalEventId, "CRM_UPDATE_FAILED", errorMessage, input.correlationId);
    logEvent(input.provider, input.externalEventId, "failed", input.payload, errorMessage, {
      idempotencyKey,
      correlationId: input.correlationId,
      deadLetterReason: "CRM_UPDATE_FAILED",
    });

    return {
      status: "failed",
      provider: input.provider,
      externalEventId: input.externalEventId,
      message: errorMessage,
      dealId: deal.id,
      transitionApplied: false,
      correlationId: input.correlationId,
    };
  }
}

function canTransition(from: DealStage, to: DealStage): boolean {
  if (from === to) return true;
  if (from === "won" || from === "lost") return false;
  return STAGE_RANK[to] >= STAGE_RANK[from];
}

function pushDeadLetter(
  provider: BridgeProvider,
  externalEventId: string,
  reason: DeadLetterReason,
  details: string,
  correlationId?: string,
) {
  const db = getPersistenceState();
  db.revenueBridgeDeadLetters.push({
    id: `rbdl_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    provider,
    externalEventId,
    reason,
    details,
    createdAt: new Date().toISOString(),
    correlationId,
  });
}

function logEvent(
  provider: BridgeProvider,
  externalEventId: string,
  status: BridgeStatus,
  payload: Record<string, unknown>,
  error: string | null,
  meta?: { idempotencyKey?: string; correlationId?: string; deadLetterReason?: string },
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
    idempotencyKey: meta?.idempotencyKey,
    correlationId: meta?.correlationId,
    deadLetterReason: meta?.deadLetterReason ?? null,
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
