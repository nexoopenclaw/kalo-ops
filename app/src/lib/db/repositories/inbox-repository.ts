import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DbContext } from "@/lib/db/types";

export async function upsertConversationForWebhook(
  ctx: DbContext,
  input: { leadId: string; channel: string; body: string },
) {
  const supabase = createSupabaseServerClient(ctx.accessToken);
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("lead_id", input.leadId)
    .eq("channel", input.channel)
    .maybeSingle();

  const conversationId = conversation?.id;

  if (!conversationId) {
    const { data: created, error: createError } = await supabase
      .from("conversations")
      .insert({ organization_id: ctx.organizationId, lead_id: input.leadId, channel: input.channel, status: "open", last_message_at: new Date().toISOString() })
      .select("id")
      .single();
    if (createError) throw new Error(createError.message);

    const { error: messageError } = await supabase.from("messages").insert({
      organization_id: ctx.organizationId,
      conversation_id: created.id,
      lead_id: input.leadId,
      direction: "inbound",
      body: input.body,
    });
    if (messageError) throw new Error(messageError.message);
    return created.id;
  }

  const { error: msgError } = await supabase.from("messages").insert({
    organization_id: ctx.organizationId,
    conversation_id: conversationId,
    lead_id: input.leadId,
    direction: "inbound",
    body: input.body,
  });
  if (msgError) throw new Error(msgError.message);

  await supabase.from("conversations").update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", conversationId);

  return conversationId;
}
