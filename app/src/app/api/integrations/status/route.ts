import { ok } from "@/lib/api-response";
import { getRuntimeConfig } from "@/lib/config";

export async function GET() {
  const config = getRuntimeConfig();

  return ok({
    isFullyConfigured: config.isFullyConfigured,
    missingKeys: config.missingKeys,
    providers: config.providers,
    timestamp: new Date().toISOString(),
  });
}
