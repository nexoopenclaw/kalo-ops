import { config as loadEnvConfig } from "dotenv-flow";
import { goLiveCheckService, type GoLiveCheckResult } from "@/lib/go-live-check-service";

loadEnvConfig({ silent: true });

function parseArgs() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");

  const urlFlagIndex = args.findIndex((a) => a === "--url");
  const urlFromFlag = urlFlagIndex >= 0 ? args[urlFlagIndex + 1] : undefined;

  const url = urlFromFlag ?? process.env.APP_URL;

  return { json, url };
}

async function fetchGoLive(url: string): Promise<GoLiveCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const headers = new Headers();
    const token = process.env.HEALTH_ENDPOINT_TOKEN?.trim();
    if (token) headers.set("x-health-token", token);

    const res = await fetch(`${url.replace(/\/$/, "")}/api/health/go-live`, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Remote go-live check failed (${res.status}): ${body.slice(0, 400)}`);
    }

    return (await res.json()) as GoLiveCheckResult;
  } finally {
    clearTimeout(timeout);
  }
}

function printHuman(result: GoLiveCheckResult, meta?: { mode: "local" | "remote"; url?: string }) {
  console.log("\nKalo Ops — Go-Live Smoke Check");
  if (meta?.mode === "remote") console.log(`mode: remote (${meta.url})`);
  if (meta?.mode === "local") console.log("mode: local");
  console.log(`checkedAt: ${result.checkedAt}`);
  console.log(`ok: ${result.ok ? "YES" : "NO"}`);

  console.log("\nConfig:");
  console.log(`  ok: ${result.checks.config.ok ? "YES" : "NO"}`);
  console.log(`  missing: ${result.checks.config.missing.join(", ") || "(none)"}`);

  console.log("\nSupabase:");
  console.log(`  ok: ${result.checks.supabase.ok ? "YES" : "NO"}`);
  if (result.checks.supabase.error) console.log(`  error: ${result.checks.supabase.error}`);
  if (result.checks.supabase.hint) console.log(`  hint: ${result.checks.supabase.hint}`);
  console.log("");
}

async function main() {
  const { json, url } = parseArgs();

  const result = url ? await fetchGoLive(url) : await goLiveCheckService.run();

  if (json) {
    process.stdout.write(`${JSON.stringify({ mode: url ? "remote" : "local", url, result })}\n`);
  } else {
    printHuman(result, { mode: url ? "remote" : "local", url });
  }

  if (!result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Go-Live smoke check failed:", error);
  process.exitCode = 1;
});
