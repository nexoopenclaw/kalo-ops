import { NextResponse } from "next/server";
import { inboxService, type Channel } from "@/lib/inbox-service";

type SendMessageBody = {
  organizationId?: string;
  conversationId?: string;
  channel?: Channel;
  body?: string;
  senderUserId?: string;
};

export async function POST(request: Request) {
  let payload: SendMessageBody;

  try {
    payload = (await request.json()) as SendMessageBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { organizationId, conversationId, channel, body, senderUserId } = payload;

  if (!organizationId || !conversationId || !channel || !body?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: "organizationId, conversationId, channel y body son obligatorios",
      },
      { status: 400 },
    );
  }

  const result = await inboxService.sendMessage({
    organizationId,
    conversationId,
    channel,
    body: body.trim(),
    senderUserId,
  });

  // TODO(Meta Graph API): replace mock delivery with live dispatch call + webhook reconciliation.
  // TODO(Supabase): persist outbound message + update conversation snapshot counters.

  return NextResponse.json({ ok: true, data: result }, { status: 202 });
}
