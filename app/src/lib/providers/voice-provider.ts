import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";

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

      return {
        provider: "voice",
        status: "ok",
        message: "Ping mock-safe OK. Voz ElevenLabs lista.",
        missingKeys: [],
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
