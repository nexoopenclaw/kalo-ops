import { fail, ok } from "@/lib/api-response";
import { reportingService } from "@/lib/reporting-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId")?.trim();
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  if (!organizationId) {
    return fail(
      {
        code: "MISSING_ORGANIZATION_ID",
        message: "Query param 'organizationId' is required.",
      },
      400,
    );
  }

  const data = await reportingService.commercialPerformance(organizationId, from, to);
  return ok(data, 200, { organizationId });
}
