import { attributionService } from "@/lib/attribution-service";
import { fail, ok } from "@/lib/api-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = String(searchParams.get("organizationId") ?? "org_1");
  return ok(await attributionService.listFallbackMappings(organizationId));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { organizationId?: string; id?: string; matchPattern?: string; contentPieceId?: string; priority?: number; active?: boolean }
    | null;

  if (!body?.matchPattern || !body.contentPieceId) {
    return fail({ code: "VALIDATION_ERROR", message: "matchPattern and contentPieceId are required" }, 400);
  }

  const row = await attributionService.upsertFallbackMapping({
    organizationId: String(body.organizationId ?? "org_1"),
    id: body.id,
    matchPattern: body.matchPattern,
    contentPieceId: body.contentPieceId,
    priority: body.priority,
    active: body.active,
  });

  return ok(row, 201);
}
