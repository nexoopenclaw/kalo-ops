import { InboxWorkspace } from "@/components/inbox/inbox-workspace";
import { inboxService } from "@/lib/inbox-service";

export default async function InboxPage() {
  const [conversations, setters] = await Promise.all([inboxService.listConversations(), inboxService.listSetters()]);

  const messagesByConversationEntries = await Promise.all(
    conversations.map(async (conversation) => [conversation.id, await inboxService.getThread(conversation.id)] as const),
  );

  const initialMessagesByConversation = Object.fromEntries(messagesByConversationEntries);

  return (
    <InboxWorkspace
      initialConversations={conversations}
      initialMessagesByConversation={initialMessagesByConversation}
      setters={setters}
    />
  );
}
