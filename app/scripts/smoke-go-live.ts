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

type RemoteEndpointCheck = {
  ok: boolean;
  status: number;
  bodyPreview?: string;
};

async function fetchJsonOrText(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

async function fetchEndpoint(url: string, path: string, headers: Headers): Promise<RemoteEndpointCheck> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}${path}`, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (res.ok) return { ok: true, status: res.status };

    const body = await fetchJsonOrText(res).catch(() => "");
    const preview = typeof body === "string" ? body : JSON.stringify(body);

    return {
      ok: false,
      status: res.status,
      bodyPreview: preview.slice(0, 400),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGoLive(url: string): Promise<{ result: GoLiveCheckResult; endpoints: Record<string, RemoteEndpointCheck> }> {
  const headers = new Headers();
  const token = process.env.HEALTH_ENDPOINT_TOKEN?.trim();
  if (token) headers.set("x-health-token", token);

  const endpoints: Record<string, RemoteEndpointCheck> = {};

  // Basic liveness should never be protected.
  endpoints["/api/health"] = await fetchEndpoint(url, "/api/health", new Headers());

  // These might be protected behind HEALTH_ENDPOINT_TOKEN.
  endpoints["/api/health/config"] = await fetchEndpoint(url, "/api/health/config", headers);
  endpoints["/api/health/go-live"] = await fetchEndpoint(url, "/api/health/go-live", headers);

  const goLive = endpoints["/api/health/go-live"];
  if (!goLive.ok) {
    const hint =
      goLive.status === 404 && !token
        ? "Endpoint might be protected. Set HEALTH_ENDPOINT_TOKEN locally to run remote smoke checks."
        : undefined;

    throw new Error(
      `Remote go-live check failed (${goLive.status})${hint ? ` — ${hint}` : ""}: ${goLive.bodyPreview ?? ""}`,
    );
  }

  // Re-fetch JSON body for the go-live endpoint now that we know it is OK.
  const res = await fetch(`${url.replace(/\/$/, "")}/api/health/go-live`, {
    method: "GET",
    headers,
  });

  return {
    endpoints,
    result: (await res.json()) as GoLiveCheckResult,
  };
}

function printHuman(
  result: GoLiveCheckResult,
  meta?: { mode: "local" | "remote"; url?: string; endpoints?: Record<string, RemoteEndpointCheck> },
) {
  console.log("\nKalo Ops — Go-Live Smoke Check");
  if (meta?.mode === "remote") console.log(`mode: remote (${meta.url})`);
  if (meta?.mode === "local") console.log("mode: local");
  console.log(`checkedAt: ${result.checkedAt}`);
  console.log(`ok: ${result.ok ? "YES" : "NO"}`);

  if (meta?.endpoints) {
    console.log("\nEndpoints:");
    for (const [path, check] of Object.entries(meta.endpoints)) {
      console.log(`  ${path}: ${check.ok ? "OK" : `FAIL (${check.status})`}`);
      if (!check.ok && check.bodyPreview) console.log(`    body: ${check.bodyPreview}`);
    }
  }

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

  if (url) {
    const remote = await fetchGoLive(url);

    if (json) {
      process.stdout.write(`${JSON.stringify({ mode: "remote", url, endpoints: remote.endpoints, result: remote.result })}\n`);
    } else {
      printHuman(remote.result, { mode: "remote", url, endpoints: remote.endpoints });
    }

    if (!remote.result.ok) process.exitCode = 1;
    return;
  }

  const local = await goLiveCheckService.run();

  if (json) {
    process.stdout.write(`${JSON.stringify({ mode: "local", result: local })}\n`);
  } else {
    printHuman(local, { mode: "local" });
  }

  if (!local.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Go-Live smoke check failed:", error);
  process.exitCode = 1;
});
