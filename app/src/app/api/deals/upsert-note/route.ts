import { NextResponse } from "next/server";
import { crmService } from "@/lib/crm-service";

type UpsertNoteBody = {
  organizationId?: string;
  dealId?: string;
  note?: string;
  objections?: string[];
};

export async function POST(request: Request) {
  let payload: UpsertNoteBody;

  try {
    payload = (await request.json()) as UpsertNoteBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { organizationId, dealId, note, objections } = payload;

  if (!organizationId || !dealId || !note?.trim()) {
    return NextResponse.json({ ok: false, error: "organizationId, dealId y note son obligatorios" }, { status: 400 });
  }

  if (objections && !Array.isArray(objections)) {
    return NextResponse.json({ ok: false, error: "objections debe ser un array de strings" }, { status: 400 });
  }

  const normalizedObjections = (objections ?? []).filter((item): item is string => typeof item === "string");

  const updated = await crmService.upsertDealNote({
    organizationId,
    dealId,
    note: note.trim(),
    objections: normalizedObjections,
  });

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Deal no encontrado" }, { status: 404 });
  }

  // TODO(Supabase): persist note record and objection rows tied to deal/organization.
  return NextResponse.json({ ok: true, data: updated });
}
