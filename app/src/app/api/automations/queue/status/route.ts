import { NextResponse } from "next/server";
import { automationQueue } from "@/lib/automation-queue";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId") ?? "org_1";

  const data = automationQueue.getStatus(organizationId);
  return NextResponse.json({ ok: true, data });
}
