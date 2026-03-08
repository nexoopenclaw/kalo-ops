import { WebhooksWorkspace } from "@/components/webhooks/webhooks-workspace";
import { ensureWebhookSeed, getWebhookMetrics, listWebhookEvents } from "@/lib/webhook-engine";

export default async function WebhooksPage() {
  await ensureWebhookSeed();

  const events = listWebhookEvents();
  const metrics = getWebhookMetrics();

  return <WebhooksWorkspace initialEvents={events} initialMetrics={metrics} />;
}
