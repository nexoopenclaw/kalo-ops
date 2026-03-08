"use client";

import { useState } from "react";
import type { AdapterHealth, SupportedChannel } from "@/lib/channel-adapters";

type ChannelMetric = {
  channel: SupportedChannel;
  queueDepth: number;
  slaBreaches: number;
  backlog: number;
};

type OpsWorkspaceProps = {
  initialHealth: AdapterHealth[];
  initialMetrics: ChannelMetric[];
};

const channelLabel: Record<SupportedChannel, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  email: "Email",
};

export function OpsWorkspace({ initialHealth, initialMetrics }: OpsWorkspaceProps) {
  const [health, setHealth] = useState(initialHealth);
  const [metrics] = useState(initialMetrics);
  const [busy, setBusy] = useState<string | null>(null);

  const runAction = async (channel: SupportedChannel, action: "pause" | "resume" | "retry_failed") => {
    setBusy(`${channel}_${action}`);
    try {
      const response = await fetch("/api/channels/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, action }),
      });
      const json = (await response.json()) as { ok: boolean; data?: AdapterHealth };

      if (json.ok && json.data && action !== "retry_failed") {
        setHealth((prev) => prev.map((item) => (item.channel === channel ? json.data! : item)));
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">Operaciones multicanal</h1>
        <p className="text-sm text-zinc-400">Monitoreo de adapters, backlog y acciones rápidas (mock operativo).</p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.channel} className="card p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{channelLabel[metric.channel]}</p>
            <p className="mt-2 text-xl font-semibold text-[#d4e83a]">Cola: {metric.queueDepth}</p>
            <p className="text-sm text-zinc-300">Brechas SLA: {metric.slaBreaches}</p>
            <p className="text-sm text-zinc-300">Backlog: {metric.backlog}</p>
          </article>
        ))}
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Estado de adapters</h2>
        <div className="mt-3 space-y-2">
          {health.map((adapter) => (
            <article key={adapter.channel} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{channelLabel[adapter.channel]}</p>
                  <p className="text-xs text-zinc-400">{adapter.detail}</p>
                </div>
                <span
                  className={`rounded-md border px-2 py-1 text-xs ${
                    adapter.state === "healthy"
                      ? "border-[#d4e83a]/35 bg-[#d4e83a]/10 text-[#d4e83a]"
                      : adapter.state === "paused"
                        ? "border-orange-300/40 bg-orange-400/10 text-orange-200"
                        : "border-red-300/40 bg-red-400/10 text-red-200"
                  }`}
                >
                  {adapter.state}
                </span>
              </div>

              <div className="mt-2 text-xs text-zinc-400">
                Latencia {adapter.latencyMs}ms · Queue {adapter.queueDepth} · Último sync {new Date(adapter.lastSyncAt).toLocaleTimeString("es-ES")}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => runAction(adapter.channel, "pause")}
                  disabled={Boolean(busy)}
                  className="rounded-md border border-white/20 px-2 py-1 text-zinc-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Pausar
                </button>
                <button
                  onClick={() => runAction(adapter.channel, "resume")}
                  disabled={Boolean(busy)}
                  className="rounded-md border border-[#d4e83a]/35 bg-[#d4e83a]/10 px-2 py-1 text-[#d4e83a] disabled:opacity-50"
                >
                  Reanudar
                </button>
                <button
                  onClick={() => runAction(adapter.channel, "retry_failed")}
                  disabled={Boolean(busy)}
                  className="rounded-md border border-white/20 px-2 py-1 text-zinc-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Reintentar fallidos
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
