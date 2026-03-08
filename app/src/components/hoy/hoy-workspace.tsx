"use client";

import Link from "next/link";
import { useState } from "react";
import type { HoySummary } from "@/lib/hoy-service";

type Props = {
  initialData: HoySummary;
};

export function HoyWorkspace({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/hoy/summary");
      const json = (await response.json()) as { ok: boolean; data?: HoySummary };
      if (json.ok && json.data) setData(json.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-4">
      <section className="card p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Hoy · Cockpit Operativo</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Command Center del día</h1>
            <p className="text-sm text-zinc-400">Prioridades, SLA, riesgo de pipeline y alertas en una sola vista ejecutiva.</p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-4 py-2 text-sm font-medium text-[#d4e83a] disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Actualizar snapshot"}
          </button>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <article className="card p-4">
          <h2 className="text-lg font-semibold">Prioridades de hoy</h2>
          <div className="mt-3 space-y-2">
            {data.priorities.map((task) => (
              <div key={task.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-zinc-100">{task.title}</p>
                  <span className={`rounded-md px-2 py-0.5 text-xs ${task.priority === "alta" ? "bg-red-500/20 text-red-300" : "bg-zinc-600/20 text-zinc-300"}`}>
                    {task.priority}
                  </span>
                </div>
                <p className="mt-1 text-zinc-400">{task.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-semibold">Top alertas + quick actions</h2>
          <div className="mt-3 space-y-2">
            {data.topAlerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                <p className={`font-medium ${alert.level === "critica" ? "text-red-300" : "text-[#d4e83a]"}`}>{alert.title}</p>
                <p className="text-zinc-400">{alert.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            {data.quickActions.map((action) => (
              <Link key={action.id} href={action.href} className="rounded-lg border border-[#d4e83a]/30 bg-[#d4e83a]/10 px-3 py-2 text-sm text-[#d4e83a] hover:bg-[#d4e83a]/15">
                {action.label}
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="card p-4">
          <h2 className="text-lg font-semibold">Inbox SLA · Cola urgente</h2>
          <div className="mt-3 space-y-2">
            {data.inboxUrgentQueue.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-zinc-400">Sin conversaciones urgentes en este turno.</p>
            ) : (
              data.inboxUrgentQueue.map((item) => (
                <div key={item.conversationId} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                  <p className="font-medium text-zinc-100">{item.leadName} · {item.channel.toUpperCase()}</p>
                  <p className="text-zinc-400">{item.dueLabel} · Owner {item.ownerName}</p>
                  <p className="mt-1 text-zinc-500">{item.preview}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-semibold">Deals en riesgo</h2>
          <div className="mt-3 space-y-2">
            {data.dealsAtRisk.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-zinc-400">Pipeline sin deals críticos por ahora.</p>
            ) : (
              data.dealsAtRisk.map((deal) => (
                <div key={deal.dealId} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                  <p className="font-medium text-zinc-100">{deal.leadName} · {deal.stage}</p>
                  <p className="text-zinc-400">Owner {deal.ownerName} · {deal.inactiveDays} días inactivo · €{deal.value.toLocaleString("es-ES")}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Revenue Bridge · Calendly + Stripe</h2>
        <p className="mt-1 text-sm text-zinc-400">Visibilidad operativa de eventos procesados y transiciones aplicadas (Booked/Won).</p>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-zinc-500">Eventos Calendly (últimos)</p>
            <p className="mt-1 text-xl font-semibold text-[#d4e83a]">{data.revenueBridge.lastCalendlyEvents.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-zinc-500">Eventos Stripe (últimos)</p>
            <p className="mt-1 text-xl font-semibold text-[#d4e83a]">{data.revenueBridge.lastStripeEvents.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-zinc-500">Transiciones aplicadas</p>
            <p className="mt-1 text-xl font-semibold">{data.revenueBridge.transitionsApplied.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-zinc-500">Fallidos / Ignorados</p>
            <p className="mt-1 text-xl font-semibold text-orange-200">{data.revenueBridge.failedCount} / {data.revenueBridge.ignoredCount}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-sm font-semibold">Calendly</p>
            <div className="mt-2 space-y-1 text-xs text-zinc-400">
              {data.revenueBridge.lastCalendlyEvents.length === 0 ? <p>Sin eventos todavía.</p> : data.revenueBridge.lastCalendlyEvents.map((item) => <p key={item.id}>{item.id} · {item.status}</p>)}
            </div>
          </article>
          <article className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-sm font-semibold">Stripe</p>
            <div className="mt-2 space-y-1 text-xs text-zinc-400">
              {data.revenueBridge.lastStripeEvents.length === 0 ? <p>Sin eventos todavía.</p> : data.revenueBridge.lastStripeEvents.map((item) => <p key={item.id}>{item.id} · {item.status}</p>)}
            </div>
          </article>
          <article className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-sm font-semibold">Últimas transiciones</p>
            <div className="mt-2 space-y-1 text-xs text-zinc-400">
              {data.revenueBridge.transitionsApplied.length === 0 ? (
                <p>Sin transiciones registradas.</p>
              ) : (
                data.revenueBridge.transitionsApplied.map((item) => (
                  <p key={`${item.dealId}-${item.externalEventId}`}>{item.dealId} · {item.fromStage} → <span className="text-[#d4e83a]">{item.toStage}</span></p>
                ))
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Estado rápido de experimentos y automatizaciones</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-5 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-zinc-500">Workflows activos</p>
            <p className="mt-1 text-xl font-semibold text-[#d4e83a]">{data.automationStatus.activeWorkflows}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-zinc-500">Workflows pausados</p>
            <p className="mt-1 text-xl font-semibold">{data.automationStatus.pausedWorkflows}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-zinc-500">Experimentos running</p>
            <p className="mt-1 text-xl font-semibold">{data.automationStatus.experimentsRunning}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-zinc-500">Experimentos draft</p>
            <p className="mt-1 text-xl font-semibold">{data.automationStatus.experimentsDraft}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 md:col-span-1">
            <p className="text-zinc-500">Última ejecución</p>
            <p className="mt-1 text-sm text-zinc-300">{data.automationStatus.lastExecutionSummary}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
