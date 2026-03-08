"use client";

import { useState } from "react";
import type { RiskAlertEvent, RiskCockpitData, RiskWorkflow } from "@/lib/risk-automation-service";

type Props = {
  initialData: RiskCockpitData;
};

export function HoyWorkspace({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastScanSummary, setLastScanSummary] = useState<string>("");

  const refreshCockpit = async () => {
    const response = await fetch("/api/risk/cockpit");
    const json = (await response.json()) as { ok: boolean; data?: RiskCockpitData };
    if (json.ok && json.data) setData(json.data);
  };

  const runScan = async () => {
    setBusy("scan");
    try {
      const response = await fetch("/api/risk/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: "org_1" }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        data?: { scannedDeals: number; triggeredWorkflows: number; generatedAlerts: number };
      };

      if (json.ok && json.data) {
        setLastScanSummary(
          `Scan completado · ${json.data.scannedDeals} deals evaluados · ${json.data.triggeredWorkflows} workflows disparados · ${json.data.generatedAlerts} alertas nuevas`,
        );
        await refreshCockpit();
      }
    } finally {
      setBusy(null);
    }
  };

  const toggleWorkflow = async (workflow: RiskWorkflow) => {
    setBusy(workflow.id);
    try {
      await fetch("/api/risk/workflows/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: "org_1", workflowId: workflow.id, enabled: !workflow.enabled }),
      });
      await refreshCockpit();
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="space-y-4">
      <section className="card p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Hoy · Command Center</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Riesgo Pipeline + Alertas</h1>
            <p className="text-sm text-zinc-400">Centro operativo para detectar deals en riesgo y disparar automatizaciones de rescate.</p>
          </div>
          <button
            onClick={runScan}
            disabled={Boolean(busy)}
            className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-4 py-2 text-sm font-medium text-[#d4e83a] disabled:opacity-60"
          >
            {busy === "scan" ? "Escaneando..." : "Ejecutar scan ahora"}
          </button>
        </div>
        {lastScanSummary ? <p className="mt-3 text-sm text-[#d4e83a]">{lastScanSummary}</p> : null}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="card p-4">
          <p className="text-xs text-zinc-500">Deals en riesgo</p>
          <p className="mt-2 text-2xl font-semibold text-[#d4e83a]">{data.totals.dealsAtRisk}</p>
        </article>
        <article className="card p-4">
          <p className="text-xs text-zinc-500">Revenue en riesgo</p>
          <p className="mt-2 text-2xl font-semibold">€{data.totals.revenueAtRisk.toLocaleString("es-ES")}</p>
        </article>
        <article className="card p-4">
          <p className="text-xs text-zinc-500">Reglas activas</p>
          <p className="mt-2 text-2xl font-semibold">{data.totals.activeRules}</p>
        </article>
        <article className="card p-4">
          <p className="text-xs text-zinc-500">Acciones sugeridas</p>
          <p className="mt-2 text-2xl font-semibold">{data.totals.suggestedActions}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="card p-4">
          <h2 className="text-lg font-semibold">Deals críticos ahora</h2>
          <div className="mt-3 space-y-2">
            {data.dealsAtRisk.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-zinc-400">Sin deals críticos por encima del umbral.</p>
            ) : (
              data.dealsAtRisk.map((deal) => (
                <div key={deal.dealId} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                  <p className="font-medium text-zinc-100">{deal.leadName} · {deal.stage}</p>
                  <p className="text-zinc-400">Owner: {deal.ownerName} · Inactivo {deal.inactiveDays} días · €{deal.value.toLocaleString("es-ES")}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-semibold">Recomendaciones IA operativa</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
            {data.recommendations.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-4">
          <h2 className="text-lg font-semibold">Workflows de rescate</h2>
          <div className="mt-3 space-y-2">
            {data.workflows.map((workflow) => (
              <div key={workflow.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-100">{workflow.name}</p>
                    <p className="text-zinc-400">{workflow.description}</p>
                    <p className="mt-1 text-xs text-zinc-500">Umbral: {workflow.thresholdDays} días · Acción: {workflow.actionLabel}</p>
                  </div>
                  <button
                    onClick={() => toggleWorkflow(workflow)}
                    disabled={Boolean(busy)}
                    className={`rounded-md border px-2 py-1 text-xs ${
                      workflow.enabled
                        ? "border-[#d4e83a]/40 bg-[#d4e83a]/10 text-[#d4e83a]"
                        : "border-zinc-500/40 bg-zinc-500/10 text-zinc-300"
                    }`}
                  >
                    {busy === workflow.id ? "..." : workflow.enabled ? "Activo" : "Inactivo"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-semibold">Alertas recientes</h2>
          <div className="mt-3 space-y-2">
            {data.recentAlerts.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-zinc-400">Aún no hay alertas generadas en este turno.</p>
            ) : (
              data.recentAlerts.map((alert: RiskAlertEvent) => (
                <div key={alert.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                  <p className="font-medium text-zinc-100">{alert.title}</p>
                  <p className="text-zinc-400">{alert.detail}</p>
                  <p className="mt-1 text-xs text-zinc-500">{new Date(alert.createdAt).toLocaleString("es-ES")}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
