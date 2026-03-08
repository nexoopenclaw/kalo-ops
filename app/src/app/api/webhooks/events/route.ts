import { NextResponse } from "next/server";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import { listWebhookEvents } from "@/lib/db/repositories/webhooks-repository";

export async function GET(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const url = new URL(request.url);
    const channel = url.searchParams.get("channel") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;

    const events = await listWebhookEvents(ctx, { channel, status, search });

    const total = events.length;
    const success = events.filter((event) => event.status === "processed").length;
    const avgLatencyMs = total ? Math.round(events.reduce((acc, item) => acc + Number(item.latency_ms ?? 0), 0) / total) : 0;

    return NextResponse.json({
      ok: true,
      data: {
        events,
        metrics: {
          successRate: total ? Number(((success / total) * 100).toFixed(1)) : 100,
          avgLatencyMs,
          retryQueueSize: events.filter((event) => event.status === "retrying").length,
          deadLetterCount: events.filter((event) => event.status === "failed_permanent").length,
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthContextError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
