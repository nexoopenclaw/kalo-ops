import { fail, ok } from "@/lib/api-response";
import { onboardingService } from "@/lib/onboarding-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = (url.searchParams.get("organizationId") ?? "org_1").trim();

  if (!organizationId) {
    return fail({ code: "VALIDATION_ERROR", message: "organizationId es obligatorio" }, 400);
  }

  const data = await onboardingService.getWorkspace(organizationId);
  return ok(data, 200, { organizationId });
}
