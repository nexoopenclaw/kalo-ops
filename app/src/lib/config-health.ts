export interface ConfigHealth {
  ok: boolean;
  missing: string[];
  configured: Record<string, boolean>;
}

function isSet(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function getConfigHealth(): ConfigHealth {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",

    // Webhooks (keys-ready)
    "META_APP_SECRET",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "CALENDLY_WEBHOOK_SIGNING_KEY",

    // Reliability: worker tick cron endpoint must be protected + configured for go-live.
    "CRON_JOB_TOKEN",
  ] as const;

  const configured: Record<string, boolean> = {};
  const missing: string[] = [];

  for (const key of required) {
    const value = process.env[key];
    const ok = isSet(value);
    configured[key] = ok;
    if (!ok) missing.push(key);
  }

  return {
    ok: missing.length === 0,
    missing,
    configured,
  };
}
