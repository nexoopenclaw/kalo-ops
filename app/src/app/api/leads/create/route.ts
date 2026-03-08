import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_ORG_ID = "org_demo_1";

type CreateLeadBody = {
  organizationId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  source?: string;
};

function normalize(input?: string) {
  return input?.trim() ?? "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePayload(body: CreateLeadBody) {
  const organizationId = normalize(body.organizationId) || DEFAULT_ORG_ID;
  const fullName = normalize(body.fullName);
  const email = normalize(body.email).toLowerCase();
  const phone = normalize(body.phone);
  const source = normalize(body.source) || "manual";

  if (!organizationId) return { ok: false as const, error: "organizationId cannot be empty" };
  if (organizationId.length > 64) return { ok: false as const, error: "organizationId is too long (max 64 chars)" };
  if (!fullName || fullName.length < 2) return { ok: false as const, error: "fullName is required (min 2 chars)" };
  if (fullName.length > 120) return { ok: false as const, error: "fullName is too long (max 120 chars)" };
  if (!email || !isValidEmail(email)) return { ok: false as const, error: "email is required and must be valid" };
  if (phone.length > 32) return { ok: false as const, error: "phone is too long (max 32 chars)" };
  if (source.length > 64) return { ok: false as const, error: "source is too long (max 64 chars)" };

  return {
    ok: true as const,
    payload: {
      organization_id: organizationId,
      full_name: fullName,
      email,
      phone: phone || null,
      source,
    },
  };
}

export async function POST(request: NextRequest) {
  let body: CreateLeadBody;

  try {
    body = (await request.json()) as CreateLeadBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validatePayload(body);
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("leads")
      .insert(validated.payload)
      .select("id, organization_id, full_name, email, phone, source, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to create lead",
          details: error.message,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: "Unexpected error while creating lead", details: message }, { status: 500 });
  }
}
