type SupabasePlaceholderClient = {
  url: string;
  anonKey: string;
  isConfigured: boolean;
};

/**
 * Sprint 1 placeholder.
 * Replace with `createClient` from @supabase/supabase-js once credentials are wired.
 */
export const supabaseClient: SupabasePlaceholderClient = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  get isConfigured() {
    return Boolean(this.url && this.anonKey);
  },
};

export function assertSupabaseConfigured() {
  if (!supabaseClient.isConfigured) {
    throw new Error("Supabase env vars missing. Copy .env.example into .env.local and fill placeholders.");
  }
}
