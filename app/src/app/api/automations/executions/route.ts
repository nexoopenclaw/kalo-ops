import { NextResponse } from "next/server";
import { automationExecutor } from "@/lib/automation-executor";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId") ?? "org_1";
  const limit = Number(searchParams.get("limit") ?? "30");

  const data = automationExecutor.listExecutions(organizationId, Number.isFinite(limit) ? limit : 30);
  return NextResponse.json({ ok: true, data });
}
