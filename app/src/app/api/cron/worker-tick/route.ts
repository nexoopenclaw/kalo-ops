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
    const iterationsRaw = url.searchParams.get("iterations");

    const iterationsParsed = iterationsRaw ? Number(iterationsRaw) : 3;
    const iterations = Number.isFinite(iterationsParsed) ? Math.floor(iterationsParsed) : 3;
    const clampedIterations = Math.max(1, Math.min(20, iterations));

    const organizationIds = await resolveOrganizationIds(orgId);

    const results = [] as Array<{
      organizationId: string;
      iterations: number;
      ran: number;
      stoppedBecause: "no_pending_jobs" | "max_iterations";
      ticks: unknown[];
    }>;

    for (const organizationId of organizationIds) {
      const ticks: unknown[] = [];
      let ran = 0;
      let stoppedBecause: "no_pending_jobs" | "max_iterations" = "max_iterations";

      for (let i = 0; i < clampedIterations; i++) {
        const tick = await workerService.tick(organizationId);
        ticks.push(tick);
        ran += 1;

        if (typeof tick === "object" && tick && "ran" in tick && (tick as { ran?: boolean }).ran === false) {
          stoppedBecause = "no_pending_jobs";
          break;
        }
      }

      results.push({
        organizationId,
        iterations: clampedIterations,
        ran,
        stoppedBecause,
        ticks,
      });
    }

    return ok({
      ranAt: new Date().toISOString(),
      organizations: organizationIds.length,
      iterations: clampedIterations,
      results,
    });
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
