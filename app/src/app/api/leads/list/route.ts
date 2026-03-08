import { NextResponse } from "next/server";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { listLeads } from "@/lib/db/repositories/leads-repository";

export async function GET(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 25);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ ok: false, error: "limit must be an integer between 1 and 100" }, { status: 400 });
    }

    const data = await listLeads(ctx, limit);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof AuthContextError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
