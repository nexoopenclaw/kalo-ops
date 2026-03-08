import { NextResponse } from "next/server";
import { resolveDbContext, AuthContextError } from "@/lib/db/context";
import type { SupportedChannel } from "@/lib/channel-adapters";
import { channelDispatcher } from "@/lib/channel-adapters";
import { insertWebhookEvent } from "@/lib/db/repositories/webhooks-repository";

const SUPPORTED_CHANNELS: SupportedChannel[] = ["instagram", "whatsapp", "email"];

export async function POST(request: Request) {
  try {
    const ctx = await resolveDbContext(request);
    const body = (await request.json()) as { channel?: SupportedChannel; payload?: unknown; externalId?: string; maxRetries?: number };

    if (!body.channel || !SUPPORTED_CHANNELS.includes(body.channel)) {
      return NextResponse.json({ ok: false, error: "channel debe ser instagram, whatsapp o email" }, { status: 400 });
    }

    if (!body.payload) return NextResponse.json({ ok: false, error: "payload es obligatorio" }, { status: 400 });

    const normalized = channelDispatcher.normalizeInbound(body.channel, body.payload);
    const msg = String(normalized.body ?? "").toLowerCase();
    const transient = ["force_fail", "timeout", "temporario", "retry"].some((k) => msg.includes(k));
    const maxRetries = Number(body.maxRetries ?? 3);
    const retryCount = transient ? 1 : 0;
    const status = transient ? (retryCount >= maxRetries ? "failed_permanent" : "retrying") : "processed";

    const result = await insertWebhookEvent(ctx, {
      channel: body.channel,
      externalId: body.externalId ?? normalized.eventId,
      eventId: normalized.eventId,
      payloadJson: (body.payload as Record<string, unknown>) ?? {},
      normalizedPayload: normalized as unknown as Record<string, unknown>,
      processingLog: [
        { at: new Date().toISOString(), level: "info", message: "Envelope normalizado por channel adapter." },
        { at: new Date().toISOString(), level: transient ? "warn" : "info", message: transient ? "Fallo transitorio, en retry queue." : "Evento procesado correctamente." },
      ],
      status,
      retryCount,
      maxRetries,
      nextAttemptAt: transient ? new Date(Date.now() + 60_000).toISOString() : null,
      latencyMs: 1,
      errorMessage: transient ? "Fallo transitorio" : null,
    });

    return NextResponse.json({ ok: true, data: result }, { status: result.idempotencyHit ? 200 : 202 });
  } catch (error) {
    if (error instanceof AuthContextError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
