import { NextRequest, NextResponse } from "next/server";
import { voiceService } from "@/lib/voice-service";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const organizationId = request.nextUrl.searchParams.get("organizationId") ?? "org_1";
  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "id es obligatorio" }, { status: 400 });
  }

  const data = await voiceService.getExperimentResults(organizationId, id);
  if (!data) {
    return NextResponse.json({ ok: false, error: "Experimento no encontrado" }, { status: 404 });
  }

  // TODO(Persistence): source results from experiments + experiment_events SQL tables.
  return NextResponse.json({ ok: true, data });
}
