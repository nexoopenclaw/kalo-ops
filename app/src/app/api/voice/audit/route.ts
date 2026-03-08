import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api-response";
import { voiceService } from "@/lib/voice-service";

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  const leadId = request.nextUrl.searchParams.get("leadId") ?? undefined;

  if (!organizationId) {
    return fail({ code: "VALIDATION_ERROR", message: "organizationId es obligatorio." }, 400);
  }

  const data = await voiceService.listVoiceAuditLogs(organizationId, leadId);
  return ok(data);
}
