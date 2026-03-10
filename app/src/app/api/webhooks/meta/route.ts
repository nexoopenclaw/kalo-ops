import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processMetaWebhookThroughAdapter } from "@/lib/provider-runtime";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getRequestId, logger } from "@/lib/logger";

function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !signatureHeader) return true;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const limit = checkRateLimit({ key: getClientKey(request, "webhook_meta"), limit: 120, windowMs: 60_000 });
  if (!limit.allowed) return NextResponse.json({ ok: false, error: "Rate limited" }, { status: 429 });

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, signature)) return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const result = await processMetaWebhookThroughAdapter(payload);
  logger.info("Meta webhook processed", { requestId, route: "/api/webhooks/meta", receivedEvents: result.receivedEvents });
  return NextResponse.json({ ok: true, ...result });
}
