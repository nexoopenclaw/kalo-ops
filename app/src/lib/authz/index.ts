import { fail, type ApiError } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DbContext, DealStage, MembershipRole } from "@/lib/db/types";

const roleRank: Record<MembershipRole, number> = {
  viewer: 0,
  setter: 1,
  closer: 2,
  admin: 3,
  owner: 4,
};

export function hasAnyRole(role: MembershipRole, allowed: MembershipRole[]) {
  return allowed.includes(role);
}

export function requireRole(ctx: DbContext, allowed: MembershipRole[]) {
  if (!hasAnyRole(ctx.role, allowed)) {
    const error: ApiError = {
      code: "RBAC_FORBIDDEN",
      message: `Role ${ctx.role} cannot access this resource`,
      details: { allowed },
    };
    return fail(error, 403);
  }

  return null;
}

export async function canAccessLead(ctx: DbContext, leadId: string): Promise<boolean> {
  if (roleRank[ctx.role] >= roleRank.admin) return true;

  const supabase = createSupabaseServerClient(ctx.accessToken);
  const { data, error } = await supabase
    .from("leads")
    .select("id, assigned_to_user_id")
    .eq("id", leadId)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();

  if (error || !data) return false;
  return data.assigned_to_user_id === null || data.assigned_to_user_id === ctx.user.id;
}

const stageRank: Record<DealStage, number> = {
  new: 0,
  qualified: 1,
  booked: 2,
  show: 3,
  won: 4,
  lost: 4,
};

export async function canTransitionDeal(ctx: DbContext, dealId: string, nextStage: DealStage): Promise<boolean> {
  if (ctx.role === "viewer") return false;

  const supabase = createSupabaseServerClient(ctx.accessToken);
  const { data, error } = await supabase
    .from("deals")
    .select("id, owner_user_id, stage")
    .eq("id", dealId)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();

  if (error || !data) return false;

  const isOwner = !data.owner_user_id || data.owner_user_id === ctx.user.id;
  if (!isOwner && ctx.role !== "owner" && ctx.role !== "admin") return false;

  if (ctx.role === "setter" && (nextStage === "won" || nextStage === "lost")) return false;

  return stageRank[nextStage] >= stageRank[data.stage as DealStage] || ctx.role === "owner" || ctx.role === "admin";
}
