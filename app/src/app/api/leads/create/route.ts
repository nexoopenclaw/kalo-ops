import { NextResponse } from "next/server";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { createLead } from "@/lib/db/repositories/leads-repository";

type CreateLeadBody = { fullName?: string; email?: string; phone?: string; source?: string; assignedToUserId?: string | null };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const body = (await request.json()) as CreateLeadBody;
    const fullName = body.fullName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!fullName || fullName.length < 2) return NextResponse.json({ ok: false, error: "fullName is required (min 2 chars)" }, { status: 400 });
    if (!email || !isValidEmail(email)) return NextResponse.json({ ok: false, error: "email is required and must be valid" }, { status: 400 });

    const data = await createLead(ctx, { fullName, email, phone: body.phone?.trim(), source: body.source?.trim(), assignedToUserId: body.assignedToUserId ?? null });
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthContextError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
