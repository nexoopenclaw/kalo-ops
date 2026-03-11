import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";
import { fetchJsonWithTimeout, isLiveTestEnabled } from "@/lib/providers/http";

export function createVoiceProvider(): ProviderAdapter {
  const status = getRuntimeConfig().providers.voice;

  return {
    id: "voice",
    displayName: "ElevenLabs",
    isConfigured: status.isConfigured,
    missingKeys: status.missingEnv,
    async testConnection() {
      if (!status.isConfigured) {
        return notConfiguredResult("voice", status.missingEnv);
      }

      const checkedAt = new Date().toISOString();

      if (!isLiveTestEnabled()) {
        return {
          provider: "voice",
          status: "ok",
          message: "Ping mock-safe OK. Voz ElevenLabs lista. (Enable INTEGRATIONS_LIVE_TESTS=1 to call ElevenLabs voices endpoint.)",
          missingKeys: [],
          checkedAt,
        };
      }

      const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
      if (!apiKey) return notConfiguredResult("voice", ["ELEVENLABS_API_KEY"]);

      const res = await fetchJsonWithTimeout("https://api.elevenlabs.io/v1/voices", {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
          accept: "application/json",
        },
      });

      if (!res.ok) {
        return {
          provider: "voice",
          status: "error",
          message: `ElevenLabs voices failed: ${res.error}${res.body ? ` — ${res.body}` : ""}`,
          missingKeys: [],
          checkedAt,
        };
      }

      return {
        provider: "voice",
        status: "ok",
        message: "ElevenLabs OK (voices endpoint reachable).",
        missingKeys: [],
        checkedAt,
      };
    },
  };
}
