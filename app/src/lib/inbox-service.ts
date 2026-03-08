export type Channel = "instagram" | "whatsapp" | "email" | "webchat" | "other";

export type ConversationStatus = "new" | "active" | "waiting_setter" | "waiting_lead" | "won" | "lost";

export type MessageDirection = "inbound" | "outbound" | "system";

export interface InboxConversation {
  id: string;
  organizationId: string;
  leadId: string;
  leadName: string;
  channel: Channel;
  status: ConversationStatus;
  assignedSetterId: string | null;
  assignedSetterName: string | null;
  unreadCount: number;
  hasNoReply: boolean;
  slaDueAt: string | null;
  slaBreached: boolean;
  preview: string;
  lastMessageAt: string;
}

export interface InboxMessage {
  id: string;
  organizationId: string;
  conversationId: string;
  direction: MessageDirection;
  body: string;
  sentAt: string;
  senderLabel: string;
}

export interface InboxFilters {
  status?: ConversationStatus | "all";
  setter?: string | "all";
  noReply?: boolean;
}

export interface SendMessageInput {
  organizationId: string;
  conversationId: string;
  channel: Channel;
  body: string;
  senderUserId?: string;
}

export interface SendMessageResult {
  message: InboxMessage;
  delivery: {
    provider: "mock" | "meta";
    status: "queued" | "sent" | "failed";
    externalMessageId?: string;
  };
}

const seedConversations: InboxConversation[] = [
  {
    id: "conv_1",
    organizationId: "org_1",
    leadId: "lead_1",
    leadName: "Martina Varela",
    channel: "instagram",
    status: "active",
    assignedSetterId: "set_1",
    assignedSetterName: "Nuria",
    unreadCount: 2,
    hasNoReply: false,
    slaDueAt: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
    slaBreached: false,
    preview: "Estoy interesada en mentoría 1:1. ¿Cuándo podemos hablar?",
    lastMessageAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: "conv_2",
    organizationId: "org_1",
    leadId: "lead_2",
    leadName: "Diego Rojas",
    channel: "whatsapp",
    status: "waiting_setter",
    assignedSetterId: "set_2",
    assignedSetterName: "Aitana",
    unreadCount: 0,
    hasNoReply: true,
    slaDueAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    slaBreached: true,
    preview: "Vi el caso de éxito, quiero propuesta para mi marca personal.",
    lastMessageAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
  },
  {
    id: "conv_3",
    organizationId: "org_1",
    leadId: "lead_3",
    leadName: "Sofía Team",
    channel: "email",
    status: "won",
    assignedSetterId: "set_1",
    assignedSetterName: "Nuria",
    unreadCount: 1,
    hasNoReply: false,
    slaDueAt: null,
    slaBreached: false,
    preview: "Confirmado, el pago sale hoy y arrancamos onboarding.",
    lastMessageAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
  },
];

const seedMessages: InboxMessage[] = [
  {
    id: "msg_1",
    organizationId: "org_1",
    conversationId: "conv_1",
    direction: "inbound",
    body: "Hola Kalo, ¿tenéis hueco este mes?",
    sentAt: "18:02",
    senderLabel: "Lead",
  },
  {
    id: "msg_2",
    organizationId: "org_1",
    conversationId: "conv_1",
    direction: "outbound",
    body: "Sí, tenemos dos slots. ¿Qué objetivo quieres priorizar?",
    sentAt: "18:04",
    senderLabel: "Setter",
  },
  {
    id: "msg_3",
    organizationId: "org_1",
    conversationId: "conv_1",
    direction: "inbound",
    body: "Cerrar 5 clientes high-ticket en 90 días.",
    sentAt: "18:05",
    senderLabel: "Lead",
  },
];

function applyFilters(conversations: InboxConversation[], filters: InboxFilters): InboxConversation[] {
  return conversations.filter((conversation) => {
    if (filters.status && filters.status !== "all" && conversation.status !== filters.status) {
      return false;
    }

    if (filters.setter && filters.setter !== "all" && conversation.assignedSetterId !== filters.setter) {
      return false;
    }

    if (filters.noReply && !conversation.hasNoReply) {
      return false;
    }

    return true;
  });
}

export const inboxService = {
  async listConversations(filters: InboxFilters = {}): Promise<InboxConversation[]> {
    // TODO(Supabase): replace seed with `select` from `public.conversations` joined with `public.leads` and assignments.
    return applyFilters(seedConversations, filters);
  },

  async listSetters(): Promise<Array<{ id: string; name: string }>> {
    const map = new Map<string, string>();
    for (const item of seedConversations) {
      if (item.assignedSetterId && item.assignedSetterName) {
        map.set(item.assignedSetterId, item.assignedSetterName);
      }
    }

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  },

  async getThread(conversationId: string): Promise<InboxMessage[]> {
    // TODO(Supabase): replace with `select * from public.messages where conversation_id = ... order by sent_at asc`.
    return seedMessages.filter((message) => message.conversationId === conversationId);
  },

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const message: InboxMessage = {
      id: `msg_${Date.now()}`,
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      direction: "outbound",
      body: input.body,
      sentAt: new Date().toISOString(),
      senderLabel: "Setter",
    };

    // TODO(Meta Graph API): dispatch message to WhatsApp/Instagram endpoint using access token + phone_number_id/page_id.
    // TODO(Supabase): persist sent message in `public.messages` and update conversation unread/sla timestamps in a transaction.

    return {
      message,
      delivery: {
        provider: "mock",
        status: "queued",
      },
    };
  },
};
