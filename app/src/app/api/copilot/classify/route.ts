import { NextResponse } from "next/server";
import { copilotService, type ClassifyObjectionInput } from "@/lib/copilot-service";

type ClassifyBody = Partial<ClassifyObjectionInput>;

export async function POST(request: Request) {
  let payload: ClassifyBody;

  try {
    payload = (await request.json()) as ClassifyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.context?.organizationId || !payload.message?.trim()) {
    return NextResponse.json({ ok: false, error: "context.organizationId y message son obligatorios" }, { status: 400 });
  }

  const result = await copilotService.classifyObjection({
    context: payload.context,
    message: payload.message.trim(),
  });

  // TODO(LLM): move objection taxonomy/classification to provider with schema-constrained output.
  return NextResponse.json({ ok: true, data: result });
}
