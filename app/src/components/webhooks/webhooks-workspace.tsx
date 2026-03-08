"use client";

import { useMemo, useState } from "react";
import type { SupportedChannel } from "@/lib/channel-adapters";
import type { WebhookEventStatus, WebhookEventStore } from "@/lib/in-memory-persistence";

type WebhookMetrics = {
  successRate: number;
  avgLatencyMs: number;
  retryQueueSize: number;
  deadLetterCount: number;
};

type Props = {
  initialEvents: WebhookEventStore[];
  initialMetrics: WebhookMetrics;
};

const CHANNELS: Array<SupportedChannel | "all"> = ["all", "instagram", "whatsapp", "email"];
const STATUSES: Array<WebhookEventStatus | "all"> = ["all", "processed", "retrying", "failed_permanent"];

export function WebhooksWorkspace({ initialEvents, initialMetrics }: Props) {
  const [channel, setChannel] = useState<SupportedChannel | "all">("all");
  const [status, setStatus] = useState<WebhookEventStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialEvents[0]?.id ?? null);

  const filtered = useMemo(() => {
    return initialEvents.filter((event) => {
      if (channel !== "all" && event.channel !== channel) return false;
      if (status !== "all" && event.status !== status) return false;
      if (search && !event.externalId.toLowerCase().includes(search.toLowerCase())) return false;
      if (from && new Date(event.createdAt).getTime() < new Date(from).getTime()) return false;
      if (to) {
        const end = new Date(`${to}T23:59:59Z`).getTime();
        if (new Date(event.createdAt).getTime() > end) return false;
      }
      return true;
    });
  }, [channel, status, search, from, to, initialEvents]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">Webhook Processing Center</h1>
        <p className="text-sm text-zinc-400">Centro interno para inspeccionar eventos inbound, estado de retries y cola dead-letter.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Success rate" value={`${initialMetrics.successRate}%`} />
        <MetricCard label="Latencia promedio" value={`${initialMetrics.avgLatencyMs}ms`} />
        <MetricCard label="Cola de retry" value={String(initialMetrics.retryQueueSize)} />
        <MetricCard label="Dead-letter" value={String(initialMetrics.deadLetterCount)} />
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <select value={channel} onChange={(event) => setChannel(event.target.value as SupportedChannel | "all")} className="rounded-lg border border-white/15 bg-[#0f1724] px-2 py-2 text-sm">
            {CHANNELS.map((value) => (
              <option key={value} value={value}>Canal: {value}</option>
            ))}
          </select>

          <select value={status} onChange={(event) => setStatus(event.target.value as WebhookEventStatus | "all")} className="rounded-lg border border-white/15 bg-[#0f1724] px-2 py-2 text-sm">
            {STATUSES.map((value) => (
              <option key={value} value={value}>Estado: {value}</option>
            ))}
          </select>

          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar external_id" className="rounded-lg border border-white/15 bg-[#0f1724] px-2 py-2 text-sm" />
          <input value={from} onChange={(event) => setFrom(event.target.value)} type="date" className="rounded-lg border border-white/15 bg-[#0f1724] px-2 py-2 text-sm" />
          <input value={to} onChange={(event) => setTo(event.target.value)} type="date" className="rounded-lg border border-white/15 bg-[#0f1724] px-2 py-2 text-sm" />
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <article className="card p-4">
          <h2 className="text-lg font-semibold">Timeline de eventos</h2>
          <div className="mt-3 space-y-2">
            {filtered.map((event) => (
              <button key={event.id} onClick={() => setSelectedId(event.id)} className={`w-full rounded-xl border p-3 text-left ${selected?.id === event.id ? "border-[#d4e83a]/45 bg-[#d4e83a]/10" : "border-white/10 bg-white/[0.02]"}`}>
                <p className="text-sm font-semibold">{event.externalId}</p>
                <p className="text-xs text-zinc-400">
                  {event.channel} · {event.status} · retries {event.retryCount}/{event.maxRetries} · {event.latencyMs}ms
                </p>
                <p className="text-xs text-zinc-500">Org {event.organizationId} · {new Date(event.createdAt).toLocaleString("es-ES")}</p>
              </button>
            ))}
            {filtered.length === 0 ? <p className="text-sm text-zinc-400">No hay eventos para estos filtros.</p> : null}
          </div>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-semibold">Detalle del evento</h2>
          {!selected ? (
            <p className="mt-3 text-sm text-zinc-400">Selecciona un evento para ver payload normalizado y log.</p>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-zinc-400">ID: {selected.id}</p>
              <pre className="max-h-52 overflow-auto rounded-lg border border-white/10 bg-[#0d131f] p-3 text-xs text-zinc-300">{JSON.stringify(selected.normalizedPayload, null, 2)}</pre>
              <div>
                <p className="text-sm font-semibold">Processing log</p>
                <div className="mt-2 space-y-1">
                  {selected.processingLog.map((item, index) => (
                    <p key={`${item.at}_${index}`} className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-zinc-300">
                      [{new Date(item.at).toLocaleTimeString("es-ES")}] {item.level.toUpperCase()} · {item.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="card p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#d4e83a]">{value}</p>
    </article>
  );
}
