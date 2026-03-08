import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api-response";
import { voiceService } from "@/lib/voice-service";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  const from = request.nextUrl.searchParams.get("from") ?? undefined;
  const to = request.nextUrl.searchParams.get("to") ?? undefined;
  const { id } = await context.params;

  if (!organizationId || !id?.trim()) {
    return fail({ code: "VALIDATION_ERROR", message: "organizationId e id son obligatorios." }, 400);
  }

  const data = await voiceService.getExperimentResults(organizationId, id, from, to);
  if (!data) {
    return fail({ code: "NOT_FOUND", message: "Experimento no encontrado." }, 404);
  }

  return ok(data);
}
