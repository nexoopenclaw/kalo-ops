import { getRuntimeConfig } from "@/lib/config";
import type { ProviderAdapter } from "@/lib/providers/types";
import { notConfiguredResult } from "@/lib/providers/types";
import { fetchJsonWithTimeout, isLiveTestEnabled } from "@/lib/providers/http";

export function createSlackProvider(): ProviderAdapter {
  const status = getRuntimeConfig().providers.slack;

  return {
    id: "slack",
    displayName: "Slack",
    isConfigured: status.isConfigured,
    missingKeys: status.missingEnv,
    async testConnection() {
      if (!status.isConfigured) {
        return notConfiguredResult("slack", status.missingEnv);
      }

      const checkedAt = new Date().toISOString();

      if (!isLiveTestEnabled()) {
        return {
          provider: "slack",
          status: "ok",
          message: "Ping mock-safe OK. Slack listo para alertas operativas. (Enable INTEGRATIONS_LIVE_TESTS=1 to call Slack auth.test.)",
          missingKeys: [],
          checkedAt,
        };
      }

      const token = process.env.SLACK_BOT_TOKEN?.trim();
      if (!token) return notConfiguredResult("slack", ["SLACK_BOT_TOKEN"]);

      const res = await fetchJsonWithTimeout("https://slack.com/api/auth.test", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: "",
      });

      if (!res.ok) {
        return {
          provider: "slack",
          status: "error",
          message: `Slack auth.test failed: ${res.error}${res.body ? ` — ${res.body}` : ""}`,
          missingKeys: [],
          checkedAt,
        };
      }

      const payload = res.json as Record<string, unknown>;
      if (payload.ok !== true) {
        return {
          provider: "slack",
          status: "error",
          message: `Slack auth.test returned ok=false${payload.error ? ` (${payload.error})` : ""}.`,
          missingKeys: [],
          checkedAt,
        };
      }

      const team = typeof payload.team === "string" ? payload.team : "unknown";
      return {
        provider: "slack",
        status: "ok",
        message: `Slack OK (team: ${team}).`,
        missingKeys: [],
        checkedAt,
      };
    },
  };
}
