import { NextResponse } from "next/server";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { updateDealStage } from "@/lib/db/repositories/deals-repository";
import type { DealStage } from "@/lib/db/types";

type Body = { dealId?: string; nextStage?: DealStage; reason?: string; note?: string };
const allowedStages: DealStage[] = ["new", "qualified", "booked", "show", "won", "lost"];

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const body = (await request.json()) as Body;
    if (!body.dealId || !body.nextStage) return NextResponse.json({ ok: false, error: "dealId and nextStage are required" }, { status: 400 });
    if (!allowedStages.includes(body.nextStage)) return NextResponse.json({ ok: false, error: "nextStage is invalid" }, { status: 400 });

    const data = await updateDealStage(ctx, { dealId: body.dealId, nextStage: body.nextStage, reason: body.reason, note: body.note });
    if (!data) return NextResponse.json({ ok: false, error: "Deal not found" }, { status: 404 });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof AuthContextError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
