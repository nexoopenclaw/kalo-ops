import { NextResponse } from "next/server";
import { copilotService, type SuggestRepliesInput } from "@/lib/copilot-service";

type SuggestBody = Partial<SuggestRepliesInput>;

export async function POST(request: Request) {
  let payload: SuggestBody;

  try {
    payload = (await request.json()) as SuggestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.context?.organizationId || !Array.isArray(payload.conversation) || payload.conversation.length === 0) {
    return NextResponse.json({ ok: false, error: "context.organizationId y conversation son obligatorios" }, { status: 400 });
  }

  const validTurns = payload.conversation.every((turn) =>
    turn && (turn.role === "lead" || turn.role === "agent" || turn.role === "system") && typeof turn.text === "string" && turn.text.trim().length > 0,
  );

  if (!validTurns) {
    return NextResponse.json({ ok: false, error: "conversation contiene turnos inválidos" }, { status: 400 });
  }

  const result = await copilotService.suggestReplies({
    context: payload.context,
    conversation: payload.conversation,
    objective: payload.objective,
    tone: payload.tone,
  });

  // TODO(LLM): replace mock service call with provider adapter + audit trail persistence.
  return NextResponse.json({ ok: true, data: result });
}
