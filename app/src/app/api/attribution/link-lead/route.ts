import { fail, ok } from "@/lib/api-response";
import { attributionService } from "@/lib/attribution-service";

interface LinkLeadBody {
  organizationId?: string;
  leadId?: string;
  contentPieceId?: string;
  callBooked?: boolean;
  dealWon?: boolean;
  attributedRevenue?: number;
}

export async function POST(request: Request) {
  let body: LinkLeadBody;

  try {
    body = (await request.json()) as LinkLeadBody;
  } catch {
    return fail({ code: "BAD_JSON", message: "Invalid JSON body" }, 400);
  }

  const organizationId = (body.organizationId ?? "org_1").trim();
  const leadId = (body.leadId ?? "").trim();
  const contentPieceId = (body.contentPieceId ?? "").trim();
  const attributedRevenue = body.attributedRevenue ?? 0;

  if (!leadId || !contentPieceId) {
    return fail({ code: "VALIDATION_ERROR", message: "leadId and contentPieceId are required" }, 400);
  }

  if (!Number.isFinite(Number(attributedRevenue)) || Number(attributedRevenue) < 0) {
    return fail({ code: "VALIDATION_ERROR", message: "attributedRevenue must be a positive number" }, 400);
  }

  const linked = await attributionService.linkLeadToContent({
    organizationId,
    leadId,
    contentPieceId,
    callBooked: body.callBooked,
    dealWon: body.dealWon,
    attributedRevenue: Number(attributedRevenue),
  });

  if (!linked) {
    return fail({ code: "CONTENT_NOT_FOUND", message: "contentPieceId not found in organization scope" }, 404);
  }

  return ok(linked, 201, { organizationId });
}
