import { ok } from "@/lib/api-response";
import { attributionService } from "@/lib/attribution-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = (url.searchParams.get("organizationId") ?? "org_1").trim();

  const data = await attributionService.getDailyPreview(organizationId);
  return ok(data, 200, { organizationId });
}
