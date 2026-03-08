import { fail, ok } from "@/lib/api-response";
import { channelDispatcher, type SupportedChannel } from "@/lib/channel-adapters";

interface ControlBody {
  channel?: SupportedChannel;
  action?: "pause" | "resume" | "retry_failed";
}

export async function POST(request: Request) {
  let body: ControlBody;

  try {
    body = (await request.json()) as ControlBody;
  } catch {
    return fail({ code: "BAD_JSON", message: "JSON inválido en el body" }, 400);
  }

  const channel = body.channel;
  const action = body.action;

  if (!channel || !["instagram", "whatsapp", "email"].includes(channel)) {
    return fail({ code: "VALIDATION_ERROR", message: "channel inválido" }, 400);
  }

  if (!action || !["pause", "resume", "retry_failed"].includes(action)) {
    return fail({ code: "VALIDATION_ERROR", message: "action inválida" }, 400);
  }

  if (action === "pause") return ok(await channelDispatcher.pause(channel));
  if (action === "resume") return ok(await channelDispatcher.resume(channel));

  return ok(await channelDispatcher.retryFailed(channel));
}
