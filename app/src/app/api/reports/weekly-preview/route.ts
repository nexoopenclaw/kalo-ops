import { fail, ok } from "@/lib/api-response";
import { attributionService } from "@/lib/attribution-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId")?.trim();

  if (!organizationId) {
    return fail(
      {
        code: "MISSING_ORGANIZATION_ID",
        message: "Query param 'organizationId' is required.",
      },
      400,
    );
  }

  const data = await attributionService.getWeeklyPreview(organizationId);
  return ok(data, 200, { organizationId });
}
