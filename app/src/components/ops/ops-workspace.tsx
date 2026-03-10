"use client";

import { useState } from "react";
import type { AdapterHealth, SupportedChannel } from "@/lib/channel-adapters";
import type { ProviderAdapterStatus } from "@/lib/provider-runtime";
import type { ReplayBackoffConfig } from "@/lib/webhook-replay-service";
import type { FeatureFlagState } from "@/lib/feature-flags";

type ChannelMetric = {
  channel: SupportedChannel;
  queueDepth: number;
  slaBreaches: number;
  backlog: number;
};

type OpsWorkspaceProps = {
  initialHealth: AdapterHealth[];
  initialMetrics: ChannelMetric[];
  diagnostics: {
    workerStatus: { total: number; pending: number; running: number; failed: number; completed: number };
    queueBacklogs: { automation: number; webhookRetry: number; digestRuns: number };
    latestFailuresByCategory: Array<{ reason: string; provider: string; details: string; createdAt: string }>;
  };
  integrity: {
    summary: { total: number; errors: number; warnings: number };
    issues: Array<{ message: string; suggestedFix: string; severity: "warn" | "error" }>;
  };
  providerAdapters: ProviderAdapterStatus[];
  backoffConfig: ReplayBackoffConfig;
  featureFlags: FeatureFlagState[];
  workerJobs: Array<{ id: string; type: string; status: string; attempts: number; retryCount: number; leaseOwner: string | null; updatedAt: string; lastError: string | null }>;
  globalDryRun: boolean;
};

const channelLabel: Record<SupportedChannel, string> = { instagram: "Instagram", whatsapp: "WhatsApp", email: "Email" };

export function OpsWorkspace({ initialHealth, initialMetrics, diagnostics, integrity, providerAdapters, backoffConfig, featureFlags, workerJobs, globalDryRun }: OpsWorkspaceProps) {
  const [health, setHealth] = useState(initialHealth);
  const [metrics] = useState(initialMetrics);
  const [busy, setBusy] = useState<string | null>(null);
  const [replayEventId, setReplayEventId] = useState("");
  const [replayResult, setReplayResult] = useState<string | null>(null);

  const runAction = async (channel: SupportedChannel, action: "pause" | "resume" | "retry_failed") => {
    setBusy(`${channel}_${action}`);
    try {
      const response = await fetch("/api/channels/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, action }),
      });
      const json = (await response.json()) as { ok: boolean; data?: AdapterHealth };
      if (json.ok && json.data && action !== "retry_failed") setHealth((prev) => prev.map((item) => (item.channel === channel ? json.data! : item)));
    } finally {
      setBusy(null);
    }
  };

  const runReplayDry = async () => {
    const response = await fetch("/api/webhooks/replay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: replayEventId.trim(), dryRun: true }),
    });
    const json = (await response.json()) as { ok: boolean; data?: { deterministicOutput?: string }; error?: { message?: string } };
    setReplayResult(json.ok ? `Dry-run OK · hash ${json.data?.deterministicOutput}` : `Error: ${json.error?.message ?? "fallo"}`);
  };

  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">Operaciones multicanal</h1>
        <p className="text-sm text-zinc-400">Monitoreo de adapters, backlog, replay y backoff exponencial con jitter determinista.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">{metrics.map((metric) => <article key={metric.channel} className="card p-4"><p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{channelLabel[metric.channel]}</p><p className="mt-2 text-xl font-semibold text-[#d4e83a]">Cola: {metric.queueDepth}</p><p className="text-sm text-zinc-300">Brechas SLA: {metric.slaBreaches}</p><p className="text-sm text-zinc-300">Backlog: {metric.backlog}</p></article>)}</section>

      <section className="card p-4 text-sm">
        <h2 className="text-lg font-semibold">Runtime adapters + backoff</h2>
        <p className="text-zinc-400">baseDelayMs {backoffConfig.baseDelayMs} · maxDelayMs {backoffConfig.maxDelayMs} · jitterPercent {backoffConfig.jitterPercent}</p>
        <div className="mt-2 space-y-1 text-xs">
          {providerAdapters.map((a) => (
            <p key={a.id} className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1">{a.label} · mode {a.mode} · health {a.health} · lastError {a.lastError ?? "ninguno"}</p>
          ))}
        </div>
      </section>

      <section className="card p-4 text-sm">
        <h2 className="text-lg font-semibold">Feature flags go-live</h2>
        <div className="mt-2 space-y-1 text-xs">
          {featureFlags.map((flag) => (
            <p key={flag.key} className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1">
              {flag.label} · mode <span className={flag.mode === "live" ? "text-emerald-300" : "text-orange-200"}>{flag.mode}</span> · source {flag.source}
            </p>
          ))}
        </div>
      </section>

      <section className="card p-4 text-sm">
        <h2 className="text-lg font-semibold">Safeguards outbound</h2>
        <p className="text-zinc-400">Dry-run global por organización: <span className={globalDryRun ? "text-orange-200" : "text-emerald-300"}>{globalDryRun ? "ACTIVO" : "INACTIVO"}</span></p>
        <p className="mt-1 text-xs text-zinc-500">Con dry-run activo, aunque el flag live esté ON, los envíos quedan en modo seguro/mock.</p>
      </section>

      <section className="card p-4 text-sm">
        <h2 className="text-lg font-semibold">Worker reliability v2</h2>
        <p className="text-zinc-400">Jobs persistidos con lease/lock y bookkeeping de reintentos.</p>
        <div className="mt-2 space-y-1 text-xs">
          {workerJobs.slice(0, 8).map((job) => (
            <p key={job.id} className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1">
              {job.type} · {job.status} · intentos {job.attempts} · retries {job.retryCount} · lease {job.leaseOwner ?? "-"}
              {job.lastError ? ` · error ${job.lastError}` : ""}
            </p>
          ))}
        </div>
      </section>

      <section className="card p-4 text-sm">
        <h2 className="text-lg font-semibold">Replay webhook (dry-run)</h2>
        <div className="mt-2 flex gap-2">
          <input value={replayEventId} onChange={(e) => setReplayEventId(e.target.value)} placeholder="webhook event id" className="flex-1 rounded-md border border-white/15 bg-[#0f1724] px-3 py-2" />
          <button onClick={runReplayDry} className="rounded-md border border-[#d4e83a]/35 bg-[#d4e83a]/10 px-3 py-2 text-[#d4e83a]">Ejecutar dry-run</button>
        </div>
        {replayResult ? <p className="mt-2 text-xs text-zinc-300">{replayResult}</p> : null}
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Estado de adapters</h2>
        <div className="mt-3 space-y-2">{health.map((adapter) => <article key={adapter.channel} className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{channelLabel[adapter.channel]}</p><p className="text-xs text-zinc-400">{adapter.detail}</p></div><span className={`rounded-md border px-2 py-1 text-xs ${adapter.state === "healthy" ? "border-[#d4e83a]/35 bg-[#d4e83a]/10 text-[#d4e83a]" : adapter.state === "paused" ? "border-orange-300/40 bg-orange-400/10 text-orange-200" : "border-red-300/40 bg-red-400/10 text-red-200"}`}>{adapter.state}</span></div><div className="mt-2 text-xs text-zinc-400">Latencia {adapter.latencyMs}ms · Queue {adapter.queueDepth} · Último sync {new Date(adapter.lastSyncAt).toLocaleTimeString("es-ES")}</div><div className="mt-3 flex flex-wrap gap-2 text-xs"><button onClick={() => runAction(adapter.channel, "pause")} disabled={Boolean(busy)} className="rounded-md border border-white/20 px-2 py-1 text-zinc-300 hover:bg-white/5 disabled:opacity-50">Pausar</button><button onClick={() => runAction(adapter.channel, "resume")} disabled={Boolean(busy)} className="rounded-md border border-[#d4e83a]/35 bg-[#d4e83a]/10 px-2 py-1 text-[#d4e83a] disabled:opacity-50">Reanudar</button><button onClick={() => runAction(adapter.channel, "retry_failed")} disabled={Boolean(busy)} className="rounded-md border border-white/20 px-2 py-1 text-zinc-300 hover:bg-white/5 disabled:opacity-50">Reintentar fallidos</button></div></article>)}</div>
      </section>
    </main>
  );
}
