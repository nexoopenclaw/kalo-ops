import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";

export function createMetaProvider(): ProviderAdapter {
  const status = getRuntimeConfig().providers.meta;

  return {
    id: "meta",
    displayName: "Meta (Instagram / WhatsApp)",
    isConfigured: status.isConfigured,
    missingKeys: status.missingEnv,
    async testConnection() {
      if (!status.isConfigured) {
        return notConfiguredResult("meta", status.missingEnv);
      }

      return {
        provider: "meta",
        status: "ok",
        message: "Ping mock-safe OK. Configuración lista para Instagram y WhatsApp.",
        missingKeys: [],
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
