import { fail, ok } from "@/lib/api-response";
import { attributionService, type AlertRule } from "@/lib/attribution-service";

interface UpsertAlertBody {
  id?: string;
  organizationId?: string;
  ruleType?: AlertRule["ruleType"];
  enabled?: boolean;
  threshold?: number;
  window?: AlertRule["window"];
}

const allowedRuleTypes: AlertRule["ruleType"][] = ["vip_no_response", "show_up_drop", "inbound_spike", "backlog"];
const allowedWindows: AlertRule["window"][] = ["1h", "24h", "7d"];

export async function POST(request: Request) {
  let body: UpsertAlertBody;

  try {
    body = (await request.json()) as UpsertAlertBody;
  } catch {
    return fail({ code: "BAD_JSON", message: "Invalid JSON body" }, 400);
  }

  const organizationId = (body.organizationId ?? "org_1").trim();

  if (!body.ruleType || !allowedRuleTypes.includes(body.ruleType)) {
    return fail({ code: "VALIDATION_ERROR", message: "ruleType is invalid" }, 400);
  }

  if (typeof body.enabled !== "boolean") {
    return fail({ code: "VALIDATION_ERROR", message: "enabled must be boolean" }, 400);
  }

  if (!Number.isFinite(Number(body.threshold)) || Number(body.threshold) < 0) {
    return fail({ code: "VALIDATION_ERROR", message: "threshold must be >= 0" }, 400);
  }

  if (!body.window || !allowedWindows.includes(body.window)) {
    return fail({ code: "VALIDATION_ERROR", message: "window is invalid" }, 400);
  }

  const data = await attributionService.upsertAlertRule({
    id: body.id,
    organizationId,
    ruleType: body.ruleType,
    enabled: body.enabled,
    threshold: Number(body.threshold),
    window: body.window,
  });

  return ok(data, 200, { organizationId });
}
