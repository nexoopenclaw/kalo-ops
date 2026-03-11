"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Channel, InboxConversation, InboxFilters, InboxMessage, MessageType } from "@/lib/inbox-service";

type SetterOption = { id: string; name: string };
type RealtimeStatus = "connected" | "degraded" | "offline";

type InboxWorkspaceProps = {
  initialConversations: InboxConversation[];
  initialMessagesByConversation: Record<string, InboxMessage[]>;
  setters: SetterOption[];
};

const statusOptions: Array<{ value: InboxFilters["status"]; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Nuevo" },
  { value: "active", label: "Activo" },
  { value: "waiting_setter", label: "Pendiente setter" },
  { value: "waiting_lead", label: "Esperando lead" },
  { value: "won", label: "Ganado" },
  { value: "lost", label: "Perdido" },
];

const channelTabs: Array<{ value: InboxFilters["channel"]; label: string; icon: string }> = [
  { value: "all", label: "Todo", icon: "📥" },
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "whatsapp", label: "WhatsApp", icon: "🟢" },
  { value: "email", label: "Email", icon: "✉️" },
];

const channelVisuals: Record<Channel, { icon: string; label: string }> = {
  instagram: { icon: "📸", label: "Instagram" },
  whatsapp: { icon: "🟢", label: "WhatsApp" },
  email: { icon: "✉️", label: "Email" },
  webchat: { icon: "💬", label: "Webchat" },
  other: { icon: "🔗", label: "Otro" },
};

const messageTypeBadge: Record<MessageType, string> = {
  text: "Texto",
  voice: "Voz",
  image: "Imagen",
  system: "Sistema",
};

function formatRelative(ts: string): string {
  const diffMs = Date.now() - new Date(ts).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `hace ${hours}h`;
}

export function InboxWorkspace({ initialConversations, initialMessagesByConversation, setters }: InboxWorkspaceProps) {
  const [status, setStatus] = useState<InboxFilters["status"]>("all");
  const [setter, setSetter] = useState<InboxFilters["setter"]>("all");
  const [channel, setChannel] = useState<InboxFilters["channel"]>("all");
  const [noReply, setNoReply] = useState(false);
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id ?? "");
  const [composerValue, setComposerValue] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("offline");

  const [conversations, setConversations] = useState(initialConversations);
  const [localMessagesByConversation, setLocalMessagesByConversation] = useState(initialMessagesByConversation);
  const [presence, setPresence] = useState<Record<string, boolean>>(() => Object.fromEntries(setters.map((s) => [s.id, true])));

  useEffect(() => {
    const fallbackPoll = setInterval(() => {
      setRealtimeStatus((prev) => (prev === "connected" ? "connected" : "degraded"));
      setPresence((prev) => {
        const next = { ...prev };
        for (const setter of setters) {
          if (Math.random() > 0.7) next[setter.id] = !next[setter.id];
        }
        return next;
      });
    }, 15000);

    try {
      const supabase = createSupabaseBrowserClient();
      const channel = supabase
        .channel("inbox-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => setRealtimeStatus("connected"))
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => setRealtimeStatus("connected"))
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setRealtimeStatus("connected");
          if (status === "TIMED_OUT") setRealtimeStatus("degraded");
          if (status === "CLOSED" || status === "CHANNEL_ERROR") setRealtimeStatus("offline");
        });

      return () => {
        clearInterval(fallbackPoll);
        void supabase.removeChannel(channel);
      };
    } catch {
      const t = setTimeout(() => setRealtimeStatus("offline"), 0);
      return () => {
        clearTimeout(t);
        clearInterval(fallbackPoll);
      };
    }
  }, [setters]);

  const filtered = useMemo(() => {
    return conversations.filter((conversation) => {
      if (status !== "all" && conversation.status !== status) return false;
      if (setter !== "all" && conversation.assignedSetterId !== setter) return false;
      if (channel !== "all" && conversation.channel !== channel) return false;
      if (noReply && !conversation.hasNoReply) return false;
      return true;
    });
  }, [conversations, noReply, setter, status, channel]);

  const selectedConversation = filtered.find((conversation) => conversation.id === selectedId) ?? filtered[0];
  const threadMessages = selectedConversation ? (localMessagesByConversation[selectedConversation.id] ?? []) : [];

  const onSend = () => {
    if (!composerValue.trim() || !selectedConversation) return;

    const newMessage: InboxMessage = {
      id: `local_${Date.now()}`,
      organizationId: "org_1",
      conversationId: selectedConversation.id,
      direction: "outbound",
      messageType: "text",
      sourceChannel: selectedConversation.channel,
      body: composerValue.trim(),
      senderLabel: "Setter",
      sentAt: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    };

    setLocalMessagesByConversation((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] ?? []), newMessage],
    }));

    setConversations((prev) =>
      prev.map((item) =>
        item.id === selectedConversation.id
          ? { ...item, preview: composerValue.trim(), lastMessageAt: new Date().toISOString(), hasNoReply: false }
          : item,
      ),
    );

    setComposerValue("");
  };

  return (
    <main className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <section className="card p-3">
        <header className="mb-3 px-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Inbox multicanal</h3>
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] ${
                realtimeStatus === "connected"
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                  : realtimeStatus === "degraded"
                    ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                    : "border-zinc-500/40 bg-zinc-500/15 text-zinc-300"
              }`}
            >
              realtime: {realtimeStatus}
            </span>
          </div>
          <p className="text-xs text-zinc-500">Cola unificada con filtros por canal, estado, owner y SLA.</p>
        </header>

        <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
          <div className="col-span-2 flex gap-1 rounded-lg border border-white/10 bg-[#0f1728] p-1">
            {channelTabs.map((tab) => (
              <button
                key={tab.value ?? "all"}
                onClick={() => setChannel(tab.value)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs transition ${
                  channel === tab.value ? "bg-[#d4e83a]/20 text-[#d4e83a]" : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <label className="col-span-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">Estado</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as InboxFilters["status"])}
            className="col-span-2 rounded-lg border border-white/15 bg-[#101827] px-2 py-2 text-sm text-zinc-200"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value ?? "all"}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="col-span-2 mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">Owner</label>
          <select
            value={setter}
            onChange={(event) => setSetter(event.target.value)}
            className="col-span-2 rounded-lg border border-white/15 bg-[#101827] px-2 py-2 text-sm text-zinc-200"
          >
            <option value="all">Todos</option>
            {setters.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} {presence[option.id] ? "🟢" : "⚪"}
              </option>
            ))}
          </select>

          <button
            onClick={() => setNoReply((current) => !current)}
            className={`col-span-2 mt-1 rounded-lg border px-3 py-2 text-sm transition ${
              noReply
                ? "border-[#d4e83a]/40 bg-[#d4e83a]/15 text-[#d4e83a]"
                : "border-white/15 bg-transparent text-zinc-300 hover:bg-white/5"
            }`}
          >
            Solo sin respuesta
          </button>
        </div>

        <div className="space-y-1">
          {filtered.map((thread) => {
            const active = thread.id === (selectedConversation?.id ?? "");
            return (
              <article
                key={thread.id}
                onClick={() => setSelectedId(thread.id)}
                className={`cursor-pointer rounded-xl border p-3 transition ${
                  active ? "border-[#d4e83a]/40 bg-[#d4e83a]/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{thread.leadName}</p>
                  {thread.unreadCount > 0 && (
                    <span className="rounded-full bg-[#d4e83a] px-2 py-0.5 text-xs font-semibold text-black">{thread.unreadCount}</span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
                  <span className="rounded-md border border-white/15 px-1.5 py-0.5 text-zinc-300">
                    {channelVisuals[thread.channel].icon} {channelVisuals[thread.channel].label}
                  </span>
                  <span>•</span>
                  <span>
                    Owner: {thread.ownerName ?? "Sin owner"} {thread.assignedSetterId && presence[thread.assignedSetterId] ? "🟢" : "⚪"}
                  </span>
                  <span>•</span>
                  <span className="uppercase">Etapa: {thread.stage}</span>
                </div>

                <p className="mt-2 line-clamp-2 text-sm text-zinc-300">{thread.preview}</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{formatRelative(thread.lastMessageAt)}</span>
                  <span
                    className={`rounded-md border px-2 py-0.5 ${
                      thread.slaBreached
                        ? "border-red-400/45 bg-red-500/15 text-red-200"
                        : "border-[#d4e83a]/35 bg-[#d4e83a]/12 text-[#d4e83a]"
                    }`}
                  >
                    {thread.slaBreached ? "SLA vencido" : "SLA OK"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card p-4">
        <header className="border-b border-white/10 pb-3">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            {selectedConversation ? `${channelVisuals[selectedConversation.channel].icon} ${channelVisuals[selectedConversation.channel].label}` : "inbox"}
          </p>
          <h3 className="text-lg font-semibold">{selectedConversation?.leadName ?? "Sin selección"}</h3>
        </header>

        <div className="space-y-3 py-4">
          {threadMessages.map((message) => (
            <div key={message.id} className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                  message.direction === "outbound" ? "bg-[#d4e83a] text-black" : "bg-white/10 text-zinc-100"
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em]">
                  <span className={`${message.direction === "outbound" ? "text-black/70" : "text-zinc-400"}`}>
                    {channelVisuals[message.sourceChannel].icon} {channelVisuals[message.sourceChannel].label}
                  </span>
                  <span className={`rounded-md border px-1.5 py-0.5 ${message.direction === "outbound" ? "border-black/20" : "border-white/20"}`}>
                    {messageTypeBadge[message.messageType]}
                  </span>
                </div>
                {message.body}
                <p className={`mt-1 text-[11px] ${message.direction === "outbound" ? "text-black/70" : "text-zinc-400"}`}>
                  {message.sentAt}
                </p>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">Composer</p>
          <div className="flex gap-2">
            <textarea
              value={composerValue}
              onChange={(event) => setComposerValue(event.target.value)}
              rows={2}
              placeholder="Escribe una respuesta clara y accionable..."
              className="min-h-[68px] flex-1 resize-none rounded-lg border border-white/15 bg-[#0d1420] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#d4e83a]/40"
            />
            <button
              onClick={onSend}
              className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-4 py-2 text-sm font-medium text-[#d4e83a] hover:bg-[#d4e83a]/20"
            >
              Enviar
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
