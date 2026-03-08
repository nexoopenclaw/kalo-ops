import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    const { error } = await supabase.from("organizations").select("id", { count: "exact", head: true }).limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Supabase query failed",
          details: error.message,
          hint: "Run migrations and verify env vars NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, status: "connected", checkedAt: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: "Supabase ping failed",
        details: message,
      },
      { status: 500 },
    );
  }
}
