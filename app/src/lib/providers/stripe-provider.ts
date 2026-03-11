import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";
import Stripe from "stripe";
import { isLiveTestEnabled } from "@/lib/providers/http";

export function createStripeProvider(): ProviderAdapter {
  const status = getRuntimeConfig().providers.stripe;

  return {
    id: "stripe",
    displayName: "Stripe",
    isConfigured: status.isConfigured,
    missingKeys: status.missingEnv,
    async testConnection() {
      if (!status.isConfigured) {
        return notConfiguredResult("stripe", status.missingEnv);
      }

      const checkedAt = new Date().toISOString();

      if (!isLiveTestEnabled()) {
        return {
          provider: "stripe",
          status: "ok",
          message: "Ping mock-safe OK. Claves Stripe detectadas. (Enable INTEGRATIONS_LIVE_TESTS=1 to call Stripe.)",
          missingKeys: [],
          checkedAt,
        };
      }

      const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
      if (!secretKey) {
        return notConfiguredResult("stripe", ["STRIPE_SECRET_KEY"]);
      }

      try {
        const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });
        const account = await stripe.accounts.retrieve();

        return {
          provider: "stripe",
          status: "ok",
          message: `Stripe OK (account ${account.id}).`,
          missingKeys: [],
          checkedAt,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Stripe request failed";
        return {
          provider: "stripe",
          status: "error",
          message,
          missingKeys: [],
          checkedAt,
        };
      }
    },
  };
}
