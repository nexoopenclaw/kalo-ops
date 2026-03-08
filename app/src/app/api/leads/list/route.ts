import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_ORG_ID = "org_demo_1";

function resolveOrganizationId(request: NextRequest) {
  const fromQuery = request.nextUrl.searchParams.get("organizationId");
  const fromHeader = request.headers.get("x-org-id");
  const organizationId = (fromQuery ?? fromHeader ?? DEFAULT_ORG_ID).trim();

  if (!organizationId) {
    return { ok: false as const, error: "organizationId cannot be empty" };
  }

  if (organizationId.length > 64) {
    return { ok: false as const, error: "organizationId is too long (max 64 chars)" };
  }

  return { ok: true as const, organizationId };
}

export async function GET(request: NextRequest) {
  const orgResult = resolveOrganizationId(request);
  if (!orgResult.ok) {
    return NextResponse.json({ ok: false, error: orgResult.error }, { status: 400 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 25;

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ ok: false, error: "limit must be an integer between 1 and 100" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("leads")
      .select("id, organization_id, full_name, email, phone, source, created_at")
      .eq("organization_id", orgResult.organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to fetch leads",
          details: error.message,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        organizationId: orgResult.organizationId,
        count: data?.length ?? 0,
        data: data ?? [],
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: "Unexpected error while listing leads", details: message }, { status: 500 });
  }
}
