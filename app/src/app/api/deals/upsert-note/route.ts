import { NextResponse } from "next/server";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { upsertDealNote } from "@/lib/db/repositories/deals-repository";

type Body = { dealId?: string; note?: string; objections?: string[] };

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const body = (await request.json()) as Body;
    if (!body.dealId || !body.note?.trim()) return NextResponse.json({ ok: false, error: "dealId and note are required" }, { status: 400 });
    const objections = Array.isArray(body.objections) ? body.objections.filter((o): o is string => typeof o === "string") : [];
    const data = await upsertDealNote(ctx, { dealId: body.dealId, note: body.note.trim(), objections });
    if (!data) return NextResponse.json({ ok: false, error: "Deal not found" }, { status: 404 });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof AuthContextError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
