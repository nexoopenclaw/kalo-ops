import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";
import { fetchJsonWithTimeout, isLiveTestEnabled } from "@/lib/providers/http";

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

      const checkedAt = new Date().toISOString();

      if (!isLiveTestEnabled()) {
        return {
          provider: "ai",
          status: "ok",
          message: "Ping mock-safe OK. Motor AI disponible. (Enable INTEGRATIONS_LIVE_TESTS=1 to call provider API.)",
          missingKeys: [],
          checkedAt,
        };
      }

      const provider = process.env.AI_PROVIDER?.trim()?.toLowerCase();
      const apiKey = process.env.OPENAI_API_KEY?.trim();

      if (!provider) return notConfiguredResult("ai", ["AI_PROVIDER"]);

      if (provider !== "openai") {
        return {
          provider: "ai",
          status: "ok",
          message: `Live test not implemented for AI_PROVIDER=${provider}. Keys present; skipping.`,
          missingKeys: [],
          checkedAt,
        };
      }

      if (!apiKey) return notConfiguredResult("ai", ["OPENAI_API_KEY"]);

      const res = await fetchJsonWithTimeout("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          authorization: `Bearer ${apiKey}`,
          accept: "application/json",
        },
      });

      if (!res.ok) {
        return {
          provider: "ai",
          status: "error",
          message: `OpenAI models list failed: ${res.error}${res.body ? ` — ${res.body}` : ""}`,
          missingKeys: [],
          checkedAt,
        };
      }

      return {
        provider: "ai",
        status: "ok",
        message: "OpenAI OK (models endpoint reachable).",
        missingKeys: [],
        checkedAt,
      };
    },
  };
}
