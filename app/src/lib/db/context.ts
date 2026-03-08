import type { NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { DbContext, MembershipRole } from "@/lib/db/types";

export class AuthContextError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status = 401) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function bearerToken(request: NextRequest | Request): string {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new AuthContextError("UNAUTHORIZED", "Missing bearer token", 401);
  return token;
}

export async function resolveDbContext(request: NextRequest | Request): Promise<DbContext> {
  const accessToken = bearerToken(request);
  const userClient = createSupabaseServerClient(accessToken);
  const adminClient = createSupabaseServiceRoleClient();

  const { data: authData, error: authError } = await userClient.auth.getUser(accessToken);
  if (authError || !authData.user) {
    throw new AuthContextError("UNAUTHORIZED", "Invalid auth token", 401);
  }

  const requestedOrgId = request.headers.get("x-org-id")?.trim() || new URL(request.url).searchParams.get("organizationId")?.trim();

  const membershipQuery = adminClient
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", authData.user.id)
    .eq("is_active", true);

  const { data: memberships, error: membershipsError } = requestedOrgId
    ? await membershipQuery.eq("organization_id", requestedOrgId)
    : await membershipQuery;

  if (membershipsError) {
    throw new AuthContextError("AUTH_CONTEXT_FAILED", membershipsError.message, 500);
  }

  if (!memberships || memberships.length === 0) {
    throw new AuthContextError("FORBIDDEN", "No membership for resolved organization", 403);
  }

  if (!requestedOrgId && memberships.length > 1) {
    throw new AuthContextError("ORG_REQUIRED", "Multiple organizations found. Specify x-org-id", 400);
  }

  const selected = memberships[0] as { organization_id: string; role: MembershipRole };

  return {
    user: { id: authData.user.id, email: authData.user.email ?? undefined },
    organizationId: selected.organization_id,
    role: selected.role,
    accessToken,
  };
}
