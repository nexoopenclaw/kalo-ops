import { fail, ok } from "@/lib/api-response";
import { healthService } from "@/lib/health-service";

interface ActionBody {
  organizationId?: string;
  orgId?: string;
  actionLabel?: string;
  owner?: string;
  note?: string;
}

export async function POST(request: Request) {
  let body: ActionBody;

  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return fail({ code: "BAD_JSON", message: "JSON inválido" }, 400);
  }

  const organizationId = (body.organizationId ?? "org_1").trim();
  const orgId = body.orgId?.trim();
  const actionLabel = body.actionLabel?.trim();
  const owner = body.owner?.trim();

  if (!orgId || !actionLabel || !owner) {
    return fail({ code: "VALIDATION_ERROR", message: "orgId, actionLabel y owner son obligatorios" }, 400);
  }

  const data = await healthService.logAction({
    organizationId,
    orgId,
    actionLabel,
    owner,
    note: body.note?.trim(),
  });

  return ok(data, 201, { organizationId });
}
