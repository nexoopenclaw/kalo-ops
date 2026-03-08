import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";

export function createCalendlyProvider(): ProviderAdapter {
  const status = getRuntimeConfig().providers.calendly;

  return {
    id: "calendly",
    displayName: "Calendly",
    isConfigured: status.isConfigured,
    missingKeys: status.missingEnv,
    async testConnection() {
      if (!status.isConfigured) {
        return notConfiguredResult("calendly", status.missingEnv);
      }

      return {
        provider: "calendly",
        status: "ok",
        message: "Ping mock-safe OK. Calendly listo para webhooks.",
        missingKeys: [],
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
