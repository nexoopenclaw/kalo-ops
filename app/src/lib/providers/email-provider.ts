import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";

export function createEmailProvider(): ProviderAdapter {
  const status = getRuntimeConfig().providers.email;

  return {
    id: "email",
    displayName: "Resend / Email",
    isConfigured: status.isConfigured,
    missingKeys: status.missingEnv,
    async testConnection() {
      if (!status.isConfigured) {
        return notConfiguredResult("email", status.missingEnv);
      }

      return {
        provider: "email",
        status: "ok",
        message: "Ping mock-safe OK. Resend/email configurado.",
        missingKeys: [],
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
