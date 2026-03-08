import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DbContext, LeadRow } from "@/lib/db/types";

export async function listLeads(ctx: DbContext, limit = 25): Promise<LeadRow[]> {
  const supabase = createSupabaseServerClient(ctx.accessToken);
  const { data, error } = await supabase
    .from("leads")
    .select("id, organization_id, assigned_to_user_id, full_name, email, phone, source, score, tags, created_at, updated_at")
    .eq("organization_id", ctx.organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to list leads: ${error.message}`);
  return (data ?? []) as LeadRow[];
}

export async function createLead(
  ctx: DbContext,
  input: { fullName: string; email: string; phone?: string; source?: string; assignedToUserId?: string | null },
): Promise<LeadRow> {
  const supabase = createSupabaseServerClient(ctx.accessToken);
  const { data, error } = await supabase
    .from("leads")
    .insert({
      organization_id: ctx.organizationId,
      full_name: input.fullName,
      email: input.email.toLowerCase(),
      phone: input.phone ?? null,
      source: input.source ?? "manual",
      assigned_to_user_id: input.assignedToUserId ?? null,
      created_by: ctx.user.id,
    })
    .select("id, organization_id, assigned_to_user_id, full_name, email, phone, source, score, tags, created_at, updated_at")
    .single();

  if (error) throw new Error(`Failed to create lead: ${error.message}`);
  return data as LeadRow;
}
