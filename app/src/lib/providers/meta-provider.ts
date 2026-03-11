import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";
import { fetchJsonWithTimeout, isLiveTestEnabled } from "@/lib/providers/http";

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

      const checkedAt = new Date().toISOString();

      if (!isLiveTestEnabled()) {
        return {
          provider: "meta",
          status: "ok",
          message: "Ping mock-safe OK. Configuración lista para Instagram y WhatsApp. (Enable INTEGRATIONS_LIVE_TESTS=1 to call Meta Graph API.)",
          missingKeys: [],
          checkedAt,
        };
      }

      const igToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
      const waToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();

      if (!igToken && !waToken) {
        return notConfiguredResult("meta", ["INSTAGRAM_ACCESS_TOKEN", "WHATSAPP_ACCESS_TOKEN"]);
      }

      // Minimal live check: call /me on Graph API for whichever token exists.
      const tokenToUse = igToken ?? waToken!;
      const res = await fetchJsonWithTimeout(`https://graph.facebook.com/v19.0/me?access_token=${encodeURIComponent(tokenToUse)}`, {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      });

      if (!res.ok) {
        return {
          provider: "meta",
          status: "error",
          message: `Meta Graph /me failed: ${res.error}${res.body ? ` — ${res.body}` : ""}`,
          missingKeys: [],
          checkedAt,
        };
      }

      const payload = res.json as Record<string, unknown>;
      const id = typeof payload.id === "string" ? payload.id : "unknown";

      return {
        provider: "meta",
        status: "ok",
        message: `Meta OK (Graph /me id: ${id}).`,
        missingKeys: [],
        checkedAt,
      };
    },
  };
}
