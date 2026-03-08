import { NextResponse } from "next/server";
import { copilotService, type SummarizeConversationInput } from "@/lib/copilot-service";

type SummarizeBody = Partial<SummarizeConversationInput>;

export async function POST(request: Request) {
  let payload: SummarizeBody;

  try {
    payload = (await request.json()) as SummarizeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.context?.organizationId || !Array.isArray(payload.conversation) || payload.conversation.length === 0) {
    return NextResponse.json({ ok: false, error: "context.organizationId y conversation son obligatorios" }, { status: 400 });
  }

  const result = await copilotService.summarizeConversation({
    context: payload.context,
    conversation: payload.conversation,
  });

  // TODO(LLM): include token usage + latency metadata for audit/observability.
  return NextResponse.json({ ok: true, data: result });
}
