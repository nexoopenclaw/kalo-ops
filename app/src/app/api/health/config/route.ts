import { NextResponse } from "next/server";
import { getConfigHealth } from "@/lib/config-health";

function requireHealthToken(request: Request) {
  const expected = process.env.HEALTH_ENDPOINT_TOKEN?.trim();
  if (!expected) return null;

  const provided = request.headers.get("x-health-token")?.trim();
  if (provided && provided === expected) return null;

  // Hide the existence of the endpoint when protected.
  return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
}

export async function GET(request: Request) {
  const denied = requireHealthToken(request);
  if (denied) return denied;

  const health = getConfigHealth();

  // Do not leak secrets. Only expose which keys are present/missing.
  return NextResponse.json(
    {
      ok: health.ok,
      service: "kalo-ops-app",
      kind: "config",
      missing: health.missing,
      requiredMissing: health.requiredMissing,
      recommendedMissing: health.recommendedMissing,
      configured: health.configured,
      timestamp: new Date().toISOString(),
    },
    {
      status: health.ok ? 200 : 503,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
