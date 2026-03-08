import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";

export function createSlackProvider(): ProviderAdapter {
  const status = getRuntimeConfig().providers.slack;

  return {
    id: "slack",
    displayName: "Slack",
    isConfigured: status.isConfigured,
    missingKeys: status.missingEnv,
    async testConnection() {
      if (!status.isConfigured) {
        return notConfiguredResult("slack", status.missingEnv);
      }

      return {
        provider: "slack",
        status: "ok",
        message: "Ping mock-safe OK. Slack listo para alertas operativas.",
        missingKeys: [],
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
