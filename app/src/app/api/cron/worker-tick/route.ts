import { fail, ok } from "@/lib/api-response";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { workerService } from "@/lib/worker-service";

function requireCronToken(request: Request) {
  const expected = process.env.CRON_JOB_TOKEN?.trim();
  if (!expected) {
    return fail(
      {
        code: "CRON_TOKEN_NOT_CONFIGURED",
        message: "Missing CRON_JOB_TOKEN. Configure it to enable cron endpoints.",
      },
      503,
    );
  }

  const provided = request.headers.get("x-cron-token")?.trim();
  if (!provided || provided !== expected) {
    // Hide existence.
    return fail({ code: "NOT_FOUND", message: "Not found" }, 404);
  }

  return null;
}

async function resolveOrganizationIds(orgId?: string | null) {
  if (orgId) return [orgId];

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.from("organizations").select("id").limit(500);
  if (error) {
    throw new Error(`Failed to list organizations: ${error.message}`);
  }
  return (data ?? []).map((row) => row.id).filter(Boolean);
}

export async function POST(request: Request) {
  const denied = requireCronToken(request);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const orgId = url.searchParams.get("orgId");

    const organizationIds = await resolveOrganizationIds(orgId);

    const results = [] as Array<{ organizationId: string; tick: unknown }>;
    for (const organizationId of organizationIds) {
      const tick = await workerService.tick(organizationId);
      results.push({ organizationId, tick });
    }

    return ok({ ranAt: new Date().toISOString(), organizations: organizationIds.length, results });
  } catch (error) {
    return fail(
      {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unexpected error",
      },
      500,
    );
  }
}
