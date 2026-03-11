import { config as loadEnvConfig } from "dotenv-flow";
import { goLiveCheckService } from "@/lib/go-live-check-service";

loadEnvConfig({ silent: true });

function parseArgs() {
  const args = process.argv.slice(2);
  return { json: args.includes("--json") };
}

async function main() {
  const { json } = parseArgs();
  const result = await goLiveCheckService.run();

  if (json) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } else {
    console.log("\nKalo Ops — Go-Live Smoke Check");
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

  if (!result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Go-Live smoke check failed:", error);
  process.exitCode = 1;
});
