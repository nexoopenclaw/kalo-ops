import { config as loadEnvConfig } from "dotenv-flow";

loadEnvConfig({ silent: true });

function parseArgs() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");

  const urlFlagIndex = args.findIndex((a) => a === "--url");
  const urlFromFlag = urlFlagIndex >= 0 ? args[urlFlagIndex + 1] : undefined;

  const url = urlFromFlag ?? process.env.APP_URL;
  const orgIdFlagIndex = args.findIndex((a) => a === "--orgId");
  const orgId = orgIdFlagIndex >= 0 ? args[orgIdFlagIndex + 1] : undefined;

  const iterationsFlagIndex = args.findIndex((a) => a === "--iterations");
  const iterationsRaw = iterationsFlagIndex >= 0 ? args[iterationsFlagIndex + 1] : undefined;
  const iterations = iterationsRaw ? Number(iterationsRaw) : 1;

  return { json, url, orgId, iterations: Number.isFinite(iterations) ? Math.max(1, Math.min(20, Math.floor(iterations))) : 1 };
}

type SmokeCronResult = {
  ok: boolean;
  checkedAt: string;
  url?: string;
  status?: number;
  error?: string;
  hint?: string;
  bodyPreview?: string;
};

async function readBodyPreview(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const json = await res.json();
      return JSON.stringify(json).slice(0, 800);
    }
    const text = await res.text();
    return text.slice(0, 800);
  } catch {
    return "";
  }
}

async function main() {
  const { json, url, orgId, iterations } = parseArgs();
  const checkedAt = new Date().toISOString();

  if (!url) {
    const result: SmokeCronResult = {
      ok: false,
      checkedAt,
      error: "Missing APP_URL (or pass --url)",
      hint: "Example: APP_URL=https://<your-domain> npm run smoke:cron-worker",
    };

    if (json) process.stdout.write(`${JSON.stringify(result)}\n`);
    else {
      console.log("\nKalo Ops — Cron Worker Smoke Check");
      console.log(`checkedAt: ${result.checkedAt}`);
      console.log(`ok: NO (${result.error})`);
      if (result.hint) console.log(`hint: ${result.hint}`);
      console.log("");
    }

    process.exitCode = 1;
    return;
  }

  const cronToken = process.env.CRON_JOB_TOKEN?.trim();
  if (!cronToken) {
    const result: SmokeCronResult = {
      ok: false,
      checkedAt,
      url,
      error: "Missing CRON_JOB_TOKEN",
      hint: "Set CRON_JOB_TOKEN locally to validate the protected cron endpoint.",
    };

    if (json) process.stdout.write(`${JSON.stringify(result)}\n`);
    else {
      console.log("\nKalo Ops — Cron Worker Smoke Check");
      console.log(`mode: remote (${url})`);
      console.log(`checkedAt: ${result.checkedAt}`);
      console.log(`ok: NO (${result.error})`);
      if (result.hint) console.log(`hint: ${result.hint}`);
      console.log("");
    }

    process.exitCode = 1;
    return;
  }

  const baseUrl = url.replace(/\/$/, "");
  const qs = new URLSearchParams();
  qs.set("iterations", String(iterations));
  if (orgId) qs.set("orgId", orgId);

  const endpoint = `${baseUrl}/api/cron/worker-tick?${qs.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-cron-token": cronToken,
      },
      signal: controller.signal,
    });

    const bodyPreview = await readBodyPreview(res);

    const result: SmokeCronResult = {
      ok: res.ok,
      checkedAt,
      url,
      status: res.status,
      bodyPreview: res.ok ? undefined : bodyPreview,
      error: res.ok ? undefined : `Cron endpoint returned ${res.status}`,
    };

    if (json) process.stdout.write(`${JSON.stringify(result)}\n`);
    else {
      console.log("\nKalo Ops — Cron Worker Smoke Check");
      console.log(`mode: remote (${url})`);
      console.log(`checkedAt: ${result.checkedAt}`);
      console.log(`endpoint: ${endpoint}`);
      console.log(`ok: ${result.ok ? "YES" : "NO"}`);
      console.log(`status: ${res.status}`);
      if (!res.ok && result.bodyPreview) console.log(`body: ${result.bodyPreview}`);
      console.log("");
    }

    if (!res.ok) process.exitCode = 1;
  } catch (error) {
    const result: SmokeCronResult = {
      ok: false,
      checkedAt,
      url,
      error: error instanceof Error ? error.message : "Unexpected error",
      hint: "Verify APP_URL and that the deployment is reachable. Also confirm CRON_JOB_TOKEN matches the deploy env.",
    };

    if (json) process.stdout.write(`${JSON.stringify(result)}\n`);
    else {
      console.log("\nKalo Ops — Cron Worker Smoke Check");
      console.log(`mode: remote (${url})`);
      console.log(`checkedAt: ${result.checkedAt}`);
      console.log(`ok: NO (${result.error})`);
      if (result.hint) console.log(`hint: ${result.hint}`);
      console.log("");
    }

    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
  }
}

main();
