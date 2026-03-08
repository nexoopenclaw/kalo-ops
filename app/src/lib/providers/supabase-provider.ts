import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";

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

      return {
        provider: "supabase",
        status: "ok",
        message: "Ping mock-safe OK. Variables Supabase detectadas.",
        missingKeys: [],
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
