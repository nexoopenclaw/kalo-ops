export type ProviderId = "supabase" | "meta" | "stripe" | "calendly" | "email" | "slack" | "ai" | "voice";

export interface ProviderConfigStatus {
  id: ProviderId;
  label: string;
  requiredEnv: string[];
  missingEnv: string[];
  isConfigured: boolean;
}

export interface RuntimeConfig {
  providers: Record<ProviderId, ProviderConfigStatus>;
  missingKeys: string[];
  isFullyConfigured: boolean;
}

const PROVIDER_REQUIREMENTS: Record<ProviderId, { label: string; env: string[] }> = {
  supabase: {
    label: "Supabase",
    env: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  },
  meta: {
    label: "Meta (Instagram / WhatsApp)",
    env: ["META_APP_ID", "META_APP_SECRET", "META_VERIFY_TOKEN", "INSTAGRAM_ACCESS_TOKEN", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
  },
  stripe: {
    label: "Stripe",
    env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
  },
  calendly: {
    label: "Calendly",
    env: ["CALENDLY_ACCESS_TOKEN", "CALENDLY_WEBHOOK_SIGNING_KEY", "CALENDLY_ORGANIZATION_URI"],
  },
  email: {
    label: "Resend / Email",
    env: ["RESEND_API_KEY", "EMAIL_FROM", "EMAIL_REPLY_TO"],
  },
  slack: {
    label: "Slack",
    env: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET", "SLACK_DEFAULT_CHANNEL"],
  },
  ai: {
    label: "AI Provider",
    env: ["AI_PROVIDER", "OPENAI_API_KEY", "AI_MODEL_DEFAULT"],
  },
  voice: {
    label: "ElevenLabs",
    env: ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "ELEVENLABS_MODEL_ID"],
  },
};

function isPresent(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function getProviderStatus(id: ProviderId): ProviderConfigStatus {
  const provider = PROVIDER_REQUIREMENTS[id];
  const missingEnv = provider.env.filter((key) => !isPresent(process.env[key]));

  return {
    id,
    label: provider.label,
    requiredEnv: provider.env,
    missingEnv,
    isConfigured: missingEnv.length === 0,
  };
}

export function getRuntimeConfig(): RuntimeConfig {
  const providers = {
    supabase: getProviderStatus("supabase"),
    meta: getProviderStatus("meta"),
    stripe: getProviderStatus("stripe"),
    calendly: getProviderStatus("calendly"),
    email: getProviderStatus("email"),
    slack: getProviderStatus("slack"),
    ai: getProviderStatus("ai"),
    voice: getProviderStatus("voice"),
  } satisfies Record<ProviderId, ProviderConfigStatus>;

  const missingKeys = Array.from(new Set(Object.values(providers).flatMap((provider) => provider.missingEnv)));

  return {
    providers,
    missingKeys,
    isFullyConfigured: missingKeys.length === 0,
  };
}

export const providerIds = Object.keys(PROVIDER_REQUIREMENTS) as ProviderId[];
