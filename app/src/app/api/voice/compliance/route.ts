import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api-response";
import { voiceService } from "@/lib/voice-service";

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  const leadId = request.nextUrl.searchParams.get("leadId");

  if (!organizationId || !leadId) {
    return fail({ code: "VALIDATION_ERROR", message: "organizationId y leadId son obligatorios." }, 400);
  }

  const data = await voiceService.getComplianceStatus(organizationId, leadId);
  return ok(data);
}
