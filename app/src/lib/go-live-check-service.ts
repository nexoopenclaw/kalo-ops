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
    };
    supabase: {
      ok: boolean;
      hint?: string;
      error?: string;
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
        supabaseHint = "Run migrations and verify env vars NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.";
      } else {
        supabaseOk = true;
      }
    } catch (error) {
      supabaseOk = false;
      supabaseError = error instanceof Error ? error.message : "Unknown error";
      supabaseHint = "Verify Supabase env vars and network access.";
    }

    const ok = config.ok && supabaseOk;

    return {
      ok,
      checkedAt,
      checks: {
        config: {
          ok: config.ok,
          missing: config.missing,
          configured: config.configured,
        },
        supabase: {
          ok: supabaseOk,
          error: supabaseError,
          hint: supabaseHint,
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
