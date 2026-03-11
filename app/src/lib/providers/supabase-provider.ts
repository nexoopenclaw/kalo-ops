import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { isLiveTestEnabled } from "@/lib/providers/http";

export function createSupabaseProvider(): ProviderAdapter {
  const status = getRuntimeConfig().providers.supabase;

  return {
    id: "supabase",
    displayName: "Supabase",
    isConfigured: status.isConfigured,
    missingKeys: status.missingEnv,
    async testConnection() {
      if (!status.isConfigured) {
        return notConfiguredResult("supabase", status.missingEnv);
      }

      if (!isLiveTestEnabled()) {
        return {
          provider: "supabase",
          status: "ok",
          message: "Ping mock-safe OK. Variables Supabase detectadas. (Enable INTEGRATIONS_LIVE_TESTS=1 to run real query.)",
          missingKeys: [],
          checkedAt: new Date().toISOString(),
        };
      }

      try {
        const supabase = createSupabaseServiceRoleClient();
        const { error } = await supabase.from("organizations").select("id").limit(1);
        if (error) {
          return {
            provider: "supabase",
            status: "error",
            message: `Supabase query failed: ${error.message}`,
            missingKeys: [],
            checkedAt: new Date().toISOString(),
          };
        }

        return {
          provider: "supabase",
          status: "ok",
          message: "Supabase OK (service role query succeeded).",
          missingKeys: [],
          checkedAt: new Date().toISOString(),
        };
      } catch (error) {
        return {
          provider: "supabase",
          status: "error",
          message: error instanceof Error ? error.message : "Unexpected Supabase error",
          missingKeys: [],
          checkedAt: new Date().toISOString(),
        };
      }
    },
  };
}
