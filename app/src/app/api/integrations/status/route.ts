import { ok } from "@/lib/api-response";
import { getRuntimeConfig } from "@/lib/config";
import { listProviderAdapterStatus } from "@/lib/provider-runtime";

export async function GET() {
  const config = getRuntimeConfig();

  return ok({
    isFullyConfigured: config.isFullyConfigured,
    missingKeys: config.missingKeys,
    providers: config.providers,
    adapters: listProviderAdapterStatus(),
    timestamp: new Date().toISOString(),
  });
}
