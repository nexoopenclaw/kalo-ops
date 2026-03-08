import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DbContext, DealRow, DealStage } from "@/lib/db/types";

export async function updateDealStage(
  ctx: DbContext,
  input: { dealId: string; nextStage: DealStage; reason?: string; note?: string },
): Promise<DealRow | null> {
  const supabase = createSupabaseServerClient(ctx.accessToken);

  const { data: current, error: currentError } = await supabase
    .from("deals")
    .select("id, stage")
    .eq("id", input.dealId)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();
  if (currentError) throw new Error(currentError.message);
  if (!current) return null;

  const { data, error } = await supabase
    .from("deals")
    .update({ stage: input.nextStage, last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", input.dealId)
    .eq("organization_id", ctx.organizationId)
    .select("id, organization_id, lead_id, owner_user_id, stage, value, currency, notes, objections, last_activity_at, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);

  const { error: histError } = await supabase.from("deal_stage_history").insert({
    organization_id: ctx.organizationId,
    deal_id: input.dealId,
    from_stage: current.stage,
    to_stage: input.nextStage,
    changed_by_user_id: ctx.user.id,
    reason: input.reason ?? null,
    note: input.note ?? null,
  });

  if (histError) throw new Error(histError.message);
  return data as DealRow;
}

export async function upsertDealNote(ctx: DbContext, input: { dealId: string; note: string; objections: string[] }): Promise<DealRow | null> {
  const supabase = createSupabaseServerClient(ctx.accessToken);
  const { data, error } = await supabase
    .from("deals")
    .update({ notes: input.note, objections: input.objections, last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", input.dealId)
    .eq("organization_id", ctx.organizationId)
    .select("id, organization_id, lead_id, owner_user_id, stage, value, currency, notes, objections, last_activity_at, created_at, updated_at")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as DealRow) ?? null;
}
