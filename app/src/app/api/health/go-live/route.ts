import { NextResponse } from "next/server";
import { goLiveCheckService } from "@/lib/go-live-check-service";

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

  const data = await goLiveCheckService.run();
  return NextResponse.json(data, {
    status: data.ok ? 200 : 503,
    headers: {
      "cache-control": "no-store",
    },
  });
}
