import { fail, ok } from "@/lib/api-response";
import { crmService } from "@/lib/crm-service";
import { getRequestId } from "@/lib/logger";
import { revenueBridgeService } from "@/lib/revenue-bridge-service";

type Body = {
  organizationId?: string;
  dealId?: string;
  inviteeEmail?: string;
  customerEmail?: string;
  calendlyEventId?: string;
  stripeEventId?: string;
  amount?: number;
  currency?: string;
};

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return fail({ code: "INVALID_JSON", message: "Body JSON inválido" }, 400);
  }

  const organizationId = body.organizationId ?? "org_1";
  const dealId = body.dealId?.trim();
  const calendlyEventId = body.calendlyEventId?.trim() || `sim_cal_${Date.now()}`;
  const stripeEventId = body.stripeEventId?.trim() || `sim_str_${Date.now()}`;

  if (!dealId) return fail({ code: "VALIDATION_ERROR", message: "dealId es obligatorio" }, 400);

  const deal = (await crmService.listDeals(organizationId)).find((item) => item.id === dealId);
  if (!deal) return fail({ code: "NOT_FOUND", message: "Deal no encontrado" }, 404);

  const email = body.inviteeEmail?.trim() || body.customerEmail?.trim() || deal.leadProfile.email;

  const calendly = await revenueBridgeService.processCalendlyBooking(
    {
      id: calendlyEventId,
      organizationId,
      dealId,
      inviteeEmail: email,
      inviteeName: deal.leadProfile.fullName,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      raw: {
        simulated: true,
        source: "simulator",
        event: "invitee.created",
      },
    },
    requestId,
  );

  const stripe = await revenueBridgeService.processStripePayment(
    {
      id: stripeEventId,
      organizationId,
      dealId,
      customerEmail: email,
      customerName: deal.leadProfile.fullName,
      amount: body.amount ?? deal.value,
      currency: body.currency ?? deal.currency,
      raw: {
        simulated: true,
        source: "simulator",
        type: "payment_intent.succeeded",
      },
    },
    requestId,
  );

  const updatedDeal = (await crmService.listDeals(organizationId)).find((item) => item.id === dealId) ?? deal;

  return ok(
    {
      requestId,
      calendly,
      stripe,
      deal: {
        id: updatedDeal.id,
        stage: updatedDeal.stage,
        leadName: updatedDeal.leadProfile.fullName,
        leadEmail: updatedDeal.leadProfile.email,
        stageHistory: updatedDeal.stageHistory.slice(0, 6),
      },
      bridgeSnapshot: revenueBridgeService.getOperationalSnapshot(8),
    },
    200,
    { requestId },
  );
}
