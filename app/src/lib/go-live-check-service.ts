import { getConfigHealth } from "@/lib/config-health";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export interface GoLiveCheckResult {
  ok: boolean;
  checkedAt: string;
  checks: {
    config: {
      ok: boolean;
      missing: string[];
      configured: Record<string, boolean>;
      requiredMissing: string[];
      recommendedMissing: string[];
    };
    supabase: {
      ok: boolean;
      hint?: string;
      error?: string;
    };
    persistence: {
      ok: boolean;
      mode: "in_memory";
      envAllowsInMemory: boolean;
      hint?: string;
    };
  };
  meta: {
    service: "kalo-ops-app";
    runtime: {
      nodeEnv: string;
      vercelEnv?: string;
      gitCommitSha?: string;
    };
  };
}

function isProductionRuntime() {
  const nodeEnv = (process.env.NODE_ENV ?? "").toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV ?? "").toLowerCase();
  // If either says production, treat as prod.
  return nodeEnv === "production" || vercelEnv === "production";
}

function envAllowsInMemoryPersistence() {
  return (process.env.ALLOW_IN_MEMORY_PERSISTENCE ?? "").trim().toLowerCase() === "true";
}

export const goLiveCheckService = {
  async run(): Promise<GoLiveCheckResult> {
    const checkedAt = new Date().toISOString();

    const config = getConfigHealth();

    let supabaseOk = false;
    let supabaseError: string | undefined;
    let supabaseHint: string | undefined;

    try {
      const supabase = createSupabaseServiceRoleClient();
      const { error } = await supabase.from("organizations").select("id", { count: "exact", head: true }).limit(1);
      if (error) {
        supabaseOk = false;
        supabaseError = error.message;
        supabaseHint =
          "Run migrations and verify env vars NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.";
      } else {
        supabaseOk = true;
      }
    } catch (error) {
      supabaseOk = false;
      supabaseError = error instanceof Error ? error.message : "Unknown error";
      supabaseHint = "Verify Supabase env vars and network access.";
    }

    // IMPORTANT: Today several subsystems persist in memory (worker jobs, webhook retries, reporting snapshots, etc).
    // This is fine for local/dev but dangerous in production unless explicitly acknowledged.
    const inProd = isProductionRuntime();
    const allowInMemory = envAllowsInMemoryPersistence();
    const persistenceOk = !inProd || allowInMemory;

    const ok = config.ok && supabaseOk && persistenceOk;

    return {
      ok,
      checkedAt,
      checks: {
        config: {
          ok: config.ok,
          missing: config.missing,
          configured: config.configured,
          requiredMissing: config.requiredMissing,
          recommendedMissing: config.recommendedMissing,
        },
        supabase: {
          ok: supabaseOk,
          error: supabaseError,
          hint: supabaseHint,
        },
        persistence: {
          ok: persistenceOk,
          mode: "in_memory",
          envAllowsInMemory: allowInMemory,
          hint: persistenceOk
            ? undefined
            : "Production runtime detected, but ALLOW_IN_MEMORY_PERSISTENCE is not true. Either migrate persistence to Supabase (recommended) or set ALLOW_IN_MEMORY_PERSISTENCE=true explicitly to acknowledge the risk.",
        },
      },
      meta: {
        service: "kalo-ops-app",
        runtime: {
          nodeEnv: process.env.NODE_ENV ?? "unknown",
          vercelEnv: process.env.VERCEL_ENV,
          gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
        },
      },
    };
  },
};
