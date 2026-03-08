import { NextResponse } from "next/server";
import { copilotService, type ScoreConversationInput } from "@/lib/copilot-service";

type ScoreBody = Partial<ScoreConversationInput>;

export async function POST(request: Request) {
  let payload: ScoreBody;

  try {
    payload = (await request.json()) as ScoreBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.context?.organizationId || !Array.isArray(payload.conversation) || payload.conversation.length === 0) {
    return NextResponse.json({ ok: false, error: "context.organizationId y conversation son obligatorios" }, { status: 400 });
  }

  const result = await copilotService.scoreConversation({
    context: payload.context,
    conversation: payload.conversation,
  });

  // TODO(LLM): swap rubric scoring for model-evaluated rubric + deterministic normalization.
  return NextResponse.json({ ok: true, data: result });
}
