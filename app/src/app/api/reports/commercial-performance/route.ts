import { ok } from "@/lib/api-response";
import { reportingService } from "@/lib/reporting-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = (url.searchParams.get("organizationId") ?? "org_1").trim();
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  const data = await reportingService.commercialPerformance(organizationId, from, to);
  return ok(data, 200, { organizationId });
}
