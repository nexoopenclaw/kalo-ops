import type { ProviderId } from "@/lib/config";
import { createAiProvider } from "@/lib/providers/ai-provider";
import { createCalendlyProvider } from "@/lib/providers/calendly-provider";
import { createEmailProvider } from "@/lib/providers/email-provider";
import { createMetaProvider } from "@/lib/providers/meta-provider";
import { createSlackProvider } from "@/lib/providers/slack-provider";
import { createStripeProvider } from "@/lib/providers/stripe-provider";
import { createSupabaseProvider } from "@/lib/providers/supabase-provider";
import type { ProviderAdapter } from "@/lib/providers/types";
import { createVoiceProvider } from "@/lib/providers/voice-provider";

export function getProviderAdapters(): Record<ProviderId, ProviderAdapter> {
  return {
    supabase: createSupabaseProvider(),
    meta: createMetaProvider(),
    stripe: createStripeProvider(),
    calendly: createCalendlyProvider(),
    email: createEmailProvider(),
    slack: createSlackProvider(),
    ai: createAiProvider(),
    voice: createVoiceProvider(),
  };
}

export function getProviderAdapter(providerId: ProviderId): ProviderAdapter {
  return getProviderAdapters()[providerId];
}
