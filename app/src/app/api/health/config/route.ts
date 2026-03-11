import { NextResponse } from "next/server";
import { getConfigHealth } from "@/lib/config-health";

export async function GET() {
  const health = getConfigHealth();

  // Do not leak secrets. Only expose which keys are present/missing.
  return NextResponse.json(
    {
      ok: health.ok,
      service: "kalo-ops-app",
      kind: "config",
      missing: health.missing,
      configured: health.configured,
      timestamp: new Date().toISOString(),
    },
    { status: health.ok ? 200 : 503 },
  );
}
