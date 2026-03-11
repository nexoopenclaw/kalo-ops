import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";
import { fetchJsonWithTimeout, isLiveTestEnabled } from "@/lib/providers/http";

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

      const checkedAt = new Date().toISOString();

      if (!isLiveTestEnabled()) {
        return {
          provider: "calendly",
          status: "ok",
          message: "Ping mock-safe OK. Calendly listo para webhooks. (Enable INTEGRATIONS_LIVE_TESTS=1 to call /users/me.)",
          missingKeys: [],
          checkedAt,
        };
      }

      const token = process.env.CALENDLY_ACCESS_TOKEN?.trim();
      if (!token) return notConfiguredResult("calendly", ["CALENDLY_ACCESS_TOKEN"]);

      const res = await fetchJsonWithTimeout("https://api.calendly.com/users/me", {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      });

      if (!res.ok) {
        return {
          provider: "calendly",
          status: "error",
          message: `Calendly /users/me failed: ${res.error}${res.body ? ` — ${res.body}` : ""}`,
          missingKeys: [],
          checkedAt,
        };
      }

      const payload = res.json as Record<string, unknown>;
      const resource = payload.resource as Record<string, unknown> | undefined;
      const name = resource && typeof resource.name === "string" ? resource.name : "user";

      return {
        provider: "calendly",
        status: "ok",
        message: `Calendly OK (user: ${name}).`,
        missingKeys: [],
        checkedAt,
      };
    },
  };
}
