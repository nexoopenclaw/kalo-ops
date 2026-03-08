import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";

export function createAiProvider(): ProviderAdapter {
  const status = getRuntimeConfig().providers.ai;

  return {
    id: "ai",
    displayName: "AI Provider",
    isConfigured: status.isConfigured,
    missingKeys: status.missingEnv,
    async testConnection() {
      if (!status.isConfigured) {
        return notConfiguredResult("ai", status.missingEnv);
      }

      return {
        provider: "ai",
        status: "ok",
        message: "Ping mock-safe OK. Motor AI disponible.",
        missingKeys: [],
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
