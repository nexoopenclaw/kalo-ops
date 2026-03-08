import { createHash, randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DbContext } from "@/lib/db/types";

export function buildWebhookIdempotencyKey(orgId: string, channel: string, externalId: string, eventId: string) {
  return createHash("sha256").update(`${orgId}:${channel}:${externalId}:${eventId}`).digest("hex");
}

export async function insertWebhookEvent(
  ctx: DbContext,
  input: {
    channel: string;
    externalId: string;
    eventId: string;
    payloadJson: Record<string, unknown>;
    normalizedPayload: Record<string, unknown>;
    processingLog: unknown[];
    status: "processed" | "retrying" | "failed_permanent";
    retryCount: number;
    maxRetries: number;
    nextAttemptAt?: string | null;
    latencyMs: number;
    errorMessage?: string | null;
  },
) {
  const supabase = createSupabaseServerClient(ctx.accessToken);
  const idempotencyKey = buildWebhookIdempotencyKey(ctx.organizationId, input.channel, input.externalId, input.eventId);

  const { data: existing } = await supabase
    .from("webhook_events")
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) return { event: existing, idempotencyHit: true };

  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      id: randomUUID(),
      organization_id: ctx.organizationId,
      channel: input.channel,
      external_id: input.externalId,
      idempotency_key: idempotencyKey,
      payload_json: input.payloadJson,
      normalized_payload: input.normalizedPayload,
      processing_log: input.processingLog,
      status: input.status,
      retry_count: input.retryCount,
      max_retries: input.maxRetries,
      next_attempt_at: input.nextAttemptAt ?? null,
      latency_ms: input.latencyMs,
      error_message: input.errorMessage ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return { event: data, idempotencyHit: false };
}

export async function listWebhookEvents(ctx: DbContext, filters?: { channel?: string; status?: string; search?: string }) {
  const supabase = createSupabaseServerClient(ctx.accessToken);
  let query = supabase.from("webhook_events").select("*").eq("organization_id", ctx.organizationId).order("created_at", { ascending: false }).limit(100);
  if (filters?.channel) query = query.eq("channel", filters.channel);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.search) query = query.ilike("external_id", `%${filters.search}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
