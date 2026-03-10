import { computeRevenueIdempotencyKey, type BridgeProvider } from "@/lib/revenue-bridge-validation";

export function buildDeterministicBridgeEvent(provider: BridgeProvider, organizationId: string, seed: string) {
  const externalEventId = `${provider}_${seed}`;
  return {
    provider,
    organizationId,
    externalEventId,
    idempotencyKey: computeRevenueIdempotencyKey({ provider, organizationId, externalEventId }),
  };
}

export function assertIdempotencyConflict(a: Record<string, unknown>, b: Record<string, unknown>) {
  return JSON.stringify(a) !== JSON.stringify(b);
}
