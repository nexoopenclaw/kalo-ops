import { InboxWorkspace } from "@/components/inbox/inbox-workspace";
import { inboxService } from "@/lib/inbox-service";

export default async function InboxPage() {
  const [conversations, setters] = await Promise.all([inboxService.listConversations(), inboxService.listSetters()]);
  const firstConversationId = conversations[0]?.id;
  const thread = firstConversationId ? await inboxService.getThread(firstConversationId) : [];

  return <InboxWorkspace initialConversations={conversations} initialThread={thread} setters={setters} />;
}
