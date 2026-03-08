import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";

export function createStripeProvider(): ProviderAdapter {
  const status = getRuntimeConfig().providers.stripe;

  return {
    id: "stripe",
    displayName: "Stripe",
    isConfigured: status.isConfigured,
    missingKeys: status.missingEnv,
    async testConnection() {
      if (!status.isConfigured) {
        return notConfiguredResult("stripe", status.missingEnv);
      }

      return {
        provider: "stripe",
        status: "ok",
        message: "Ping mock-safe OK. Claves Stripe detectadas.",
        missingKeys: [],
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
