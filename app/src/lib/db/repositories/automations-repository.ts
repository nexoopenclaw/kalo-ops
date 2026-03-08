import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AutomationRow, DbContext } from "@/lib/db/types";

export async function createAutomation(
  ctx: DbContext,
  input: {
    name: string;
    description?: string;
    triggerType: string;
    triggerValue?: string;
    triggerWindowMinutes?: number;
    conditions: unknown[];
    actions: unknown[];
  },
): Promise<AutomationRow> {
  const supabase = createSupabaseServerClient(ctx.accessToken);
  const { data, error } = await supabase
    .from("automations")
    .insert({
      organization_id: ctx.organizationId,
      created_by: ctx.user.id,
      name: input.name,
      description: input.description ?? null,
      trigger_type: input.triggerType,
      trigger_value: input.triggerValue ?? null,
      trigger_window_minutes: input.triggerWindowMinutes ?? null,
      conditions: input.conditions,
      actions: input.actions,
    })
    .select("id, organization_id, name, description, trigger_type, trigger_value, trigger_window_minutes, conditions, actions, active, execution_count, last_run_at, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data as AutomationRow;
}

export async function toggleAutomation(ctx: DbContext, input: { workflowId: string; active: boolean }): Promise<AutomationRow | null> {
  const supabase = createSupabaseServerClient(ctx.accessToken);
  const { data, error } = await supabase
    .from("automations")
    .update({ active: input.active, updated_at: new Date().toISOString() })
    .eq("id", input.workflowId)
    .eq("organization_id", ctx.organizationId)
    .select("id, organization_id, name, description, trigger_type, trigger_value, trigger_window_minutes, conditions, actions, active, execution_count, last_run_at, created_at, updated_at")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as AutomationRow) ?? null;
}

export async function recordExecution(
  ctx: DbContext,
  input: { workflowId: string; status: "success" | "failed" | "skipped"; summary: string; context?: Record<string, unknown> },
) {
  const supabase = createSupabaseServerClient(ctx.accessToken);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("automation_executions")
    .insert({
      organization_id: ctx.organizationId,
      automation_id: input.workflowId,
      status: input.status,
      summary: input.summary,
      context: input.context ?? {},
      started_at: now,
      finished_at: now,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("automations")
    .update({ last_run_at: now, updated_at: now })
    .eq("id", input.workflowId)
    .eq("organization_id", ctx.organizationId);

  return data;
}
