export interface ConfigHealth {
  /**
   * True when the *required* go-live keys are present.
   * (Recommended keys can still be missing.)
   */
  ok: boolean;

  /** Back-compat: equals requiredMissing. */
  missing: string[];

  /**
   * Presence map for all tracked keys (required + recommended).
   * Never includes secret values.
   */
  configured: Record<string, boolean>;

  /**
   * Keys required for MVP to be considered "go-live ready".
   * This is what drives ok/missing.
   */
  requiredMissing: string[];

  /** Keys that are not strictly required, but strongly recommended for production. */
  recommendedMissing: string[];
}

function isSet(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

const REQUIRED_KEYS = [
  // Supabase (app can't work without this)
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",

  // Reliability: worker tick cron endpoint must be protected + configured for go-live.
  "CRON_JOB_TOKEN",
] as const;

const RECOMMENDED_KEYS = [
  // Health endpoints: recommended to protect in production
  "HEALTH_ENDPOINT_TOKEN",

  // Webhooks / integrations (keys-ready)
  "META_APP_ID",
  "META_APP_SECRET",
  "META_VERIFY_TOKEN",
  "INSTAGRAM_ACCESS_TOKEN",

  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",

  "CALENDLY_ACCESS_TOKEN",
  "CALENDLY_WEBHOOK_SIGNING_KEY",
  "CALENDLY_ORGANIZATION_URI",

  "SLACK_BOT_TOKEN",
  "SLACK_SIGNING_SECRET",
  "SLACK_DEFAULT_CHANNEL",

  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",

  // AI
  "AI_PROVIDER",
  "OPENAI_API_KEY",
  "AI_MODEL_DEFAULT",

  // Voice
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
  "ELEVENLABS_MODEL_ID",
] as const;

export function getConfigHealth(): ConfigHealth {
  const configured: Record<string, boolean> = {};

  const requiredMissing: string[] = [];
  for (const key of REQUIRED_KEYS) {
    const ok = isSet(process.env[key]);
    configured[key] = ok;
    if (!ok) requiredMissing.push(key);
  }

  const recommendedMissing: string[] = [];
  for (const key of RECOMMENDED_KEYS) {
    const ok = isSet(process.env[key]);
    configured[key] = ok;
    if (!ok) recommendedMissing.push(key);
  }

  return {
    ok: requiredMissing.length === 0,
    missing: requiredMissing,
    configured,
    requiredMissing,
    recommendedMissing,
  };
}
