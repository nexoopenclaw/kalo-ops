import { NextResponse } from "next/server";
import { crmService, type DealStage } from "@/lib/crm-service";

type UpdateStageBody = {
  organizationId?: string;
  dealId?: string;
  nextStage?: DealStage;
  changedByUserId?: string;
  reason?: string;
};

const allowedStages: DealStage[] = ["new", "qualified", "booked", "show", "won", "lost"];

export async function POST(request: Request) {
  let payload: UpdateStageBody;

  try {
    payload = (await request.json()) as UpdateStageBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { organizationId, dealId, nextStage, changedByUserId, reason } = payload;

  if (!organizationId || !dealId || !nextStage) {
    return NextResponse.json({ ok: false, error: "organizationId, dealId y nextStage son obligatorios" }, { status: 400 });
  }

  if (!allowedStages.includes(nextStage)) {
    return NextResponse.json({ ok: false, error: "nextStage no es válido" }, { status: 400 });
  }

  const updated = await crmService.updateDealStage({ organizationId, dealId, nextStage, changedByUserId, reason });

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Deal no encontrado" }, { status: 404 });
  }

  // TODO(Supabase): use service backed by SQL transaction and persist stage history.
  return NextResponse.json({ ok: true, data: updated });
}
