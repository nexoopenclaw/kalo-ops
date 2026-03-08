"use client";

import { useMemo, useState } from "react";
import type { InboxConversation, InboxFilters, InboxMessage } from "@/lib/inbox-service";

type SetterOption = { id: string; name: string };

type InboxWorkspaceProps = {
  initialConversations: InboxConversation[];
  initialThread: InboxMessage[];
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

function formatRelative(ts: string): string {
  const diffMs = Date.now() - new Date(ts).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `hace ${hours}h`;
}

export function InboxWorkspace({ initialConversations, initialThread, setters }: InboxWorkspaceProps) {
  const [status, setStatus] = useState<InboxFilters["status"]>("all");
  const [setter, setSetter] = useState<InboxFilters["setter"]>("all");
  const [noReply, setNoReply] = useState(false);
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id ?? "");
  const [composerValue, setComposerValue] = useState("");
  const [localThread, setLocalThread] = useState(initialThread);

  const filtered = useMemo(() => {
    return initialConversations.filter((conversation) => {
      if (status !== "all" && conversation.status !== status) return false;
      if (setter !== "all" && conversation.assignedSetterId !== setter) return false;
      if (noReply && !conversation.hasNoReply) return false;
      return true;
    });
  }, [initialConversations, noReply, setter, status]);

  const selectedConversation = filtered.find((conversation) => conversation.id === selectedId) ?? filtered[0];

  const threadMessages = selectedConversation?.id === initialConversations[0]?.id ? localThread : [];

  const onSend = () => {
    if (!composerValue.trim()) return;
    setLocalThread((prev) => [
      ...prev,
      {
        id: `local_${Date.now()}`,
        organizationId: "org_1",
        conversationId: selectedConversation?.id ?? "",
        direction: "outbound",
        body: composerValue.trim(),
        senderLabel: "Setter",
        sentAt: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setComposerValue("");
  };

  return (
    <main className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <section className="card p-3">
        <header className="mb-3 px-2">
          <h3 className="text-lg font-semibold">Inbox Core</h3>
          <p className="text-xs text-zinc-500">Prioriza por estado, setter y SLA.</p>
        </header>

        <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
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

          <label className="col-span-2 mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">Setter</label>
          <select
            value={setter}
            onChange={(event) => setSetter(event.target.value)}
            className="col-span-2 rounded-lg border border-white/15 bg-[#101827] px-2 py-2 text-sm text-zinc-200"
          >
            <option value="all">Todos</option>
            {setters.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
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
            Sin respuesta
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
                <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                  <span className="uppercase">{thread.channel}</span>
                  <span>•</span>
                  <span>{thread.assignedSetterName ?? "Sin setter"}</span>
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
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{selectedConversation?.channel ?? "inbox"}</p>
          <h3 className="text-lg font-semibold">{selectedConversation?.leadName ?? "Sin selección"}</h3>
        </header>

        <div className="space-y-3 py-4">
          {threadMessages.map((message) => (
            <div key={message.id} className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  message.direction === "outbound" ? "bg-[#d4e83a] text-black" : "bg-white/10 text-zinc-100"
                }`}
              >
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
