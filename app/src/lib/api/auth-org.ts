import { NextResponse } from "next/server";
import { AuthContextError, resolveDbContext } from "@/lib/db/context";

export async function withAuthContext<T>(request: Request, handler: (ctx: Awaited<ReturnType<typeof resolveDbContext>>) => Promise<T>) {
  try {
    const ctx = await resolveDbContext(request);
    const data = await handler(ctx);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof AuthContextError) {
      return NextResponse.json({ ok: false, error: { code: error.code, message: error.message } }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message } }, { status: 500 });
  }
}
