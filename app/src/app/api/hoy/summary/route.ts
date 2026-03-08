import { ok } from "@/lib/api-response";
import { hoyService } from "@/lib/hoy-service";

export async function GET() {
  const data = await hoyService.getSummary("org_1");
  return ok(data);
}
