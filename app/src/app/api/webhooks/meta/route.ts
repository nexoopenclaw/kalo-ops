import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processWebhook } from "@/lib/webhook-engine";

type MetaWebhookChange = {
  field?: string;
  value?: {
    messaging_product?: string;
    metadata?: Record<string, unknown>;
    contacts?: Array<Record<string, unknown>>;
    messages?: Array<Record<string, unknown>>;
    statuses?: Array<Record<string, unknown>>;
  };
};

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    changes?: MetaWebhookChange[];
  }>;
};

function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !signatureHeader) {
    return true;
  }

  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signatureHeader);

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, receivedBuf);
}

function parseWebhookEvents(payload: MetaWebhookPayload) {
  const parsed = (payload.entry ?? []).flatMap((entry) =>
    (entry.changes ?? []).flatMap((change) => {
      const value = change.value ?? {};
      const messages = value.messages ?? [];
      const statuses = value.statuses ?? [];

      return [
        ...messages.map((message) => ({
          type: "message" as const,
          field: change.field ?? "messages",
          entryId: entry.id ?? "unknown",
          timestamp: entry.time ?? Date.now(),
          message,
        })),
        ...statuses.map((status) => ({
          type: "status" as const,
          field: change.field ?? "statuses",
          entryId: entry.id ?? "unknown",
          timestamp: entry.time ?? Date.now(),
          status,
        })),
      ];
    }),
  );

  return parsed;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as MetaWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const events = parseWebhookEvents(payload);

  const processed = await Promise.all(
    events.map((event, index) =>
      processWebhook({
        organizationId: "org_1",
        channel: "instagram",
        externalId: `${event.entryId}_${event.type}_${index}`,
        payload: {
          organizationId: "org_1",
          eventId: `${event.entryId}_${event.timestamp}_${index}`,
          external_id: `${event.entryId}_${event.type}_${index}`,
          occurredAt: new Date(event.timestamp).toISOString(),
          conversationExternalId: event.entryId,
          senderExternalId: "meta_webhook",
          senderName: "Meta webhook",
          body: event.type === "message" ? JSON.stringify(event.message) : JSON.stringify(event.status),
          raw: event,
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true, receivedEvents: events.length, processed });
}
