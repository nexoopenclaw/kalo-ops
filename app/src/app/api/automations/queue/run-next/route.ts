import { NextResponse } from "next/server";
import { automationQueue } from "@/lib/automation-queue";

export async function POST(request: Request) {
  let payload: { organizationId?: string };

  try {
    payload = (await request.json()) as { organizationId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON inválido" }, { status: 400 });
  }

  if (!payload.organizationId) {
    return NextResponse.json({ ok: false, error: "organizationId es obligatorio" }, { status: 400 });
  }

  const data = await automationQueue.runNext(payload.organizationId);
  return NextResponse.json({ ok: true, data }, { status: 202 });
}
