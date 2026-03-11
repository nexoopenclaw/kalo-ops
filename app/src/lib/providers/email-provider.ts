import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";
import { fetchJsonWithTimeout, isLiveTestEnabled } from "@/lib/providers/http";

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

      const checkedAt = new Date().toISOString();

      if (!isLiveTestEnabled()) {
        return {
          provider: "email",
          status: "ok",
          message: "Ping mock-safe OK. Resend/email configurado. (Enable INTEGRATIONS_LIVE_TESTS=1 to call Resend API.)",
          missingKeys: [],
          checkedAt,
        };
      }

      const token = process.env.RESEND_API_KEY?.trim();
      if (!token) return notConfiguredResult("email", ["RESEND_API_KEY"]);

      const res = await fetchJsonWithTimeout("https://api.resend.com/domains", {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      });

      if (!res.ok) {
        return {
          provider: "email",
          status: "error",
          message: `Resend domains check failed: ${res.error}${res.body ? ` — ${res.body}` : ""}`,
          missingKeys: [],
          checkedAt,
        };
      }

      return {
        provider: "email",
        status: "ok",
        message: "Resend OK (domains endpoint reachable).",
        missingKeys: [],
        checkedAt,
      };
    },
  };
}
