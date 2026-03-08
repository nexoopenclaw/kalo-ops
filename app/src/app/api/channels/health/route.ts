import { ok } from "@/lib/api-response";
import { channelDispatcher } from "@/lib/channel-adapters";

export async function GET() {
  const adapters = await channelDispatcher.health();

  return ok(
    {
      adapters,
      todo: "Conectar health checks reales cuando existan credenciales y webhooks en producción.",
    },
    200,
    { count: adapters.length },
  );
}
