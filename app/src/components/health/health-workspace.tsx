"use client";

import { useMemo, useState } from "react";
import type { HealthOrgRecord, HealthSummary } from "@/lib/health-service";

type Props = {
  summary: HealthSummary;
  orgs: HealthOrgRecord[];
};

export function HealthWorkspace({ summary, orgs }: Props) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(orgs[0]?.id ?? null);
  const [actionFeedback, setActionFeedback] = useState<string>("");

  const selected = useMemo(() => orgs.find((org) => org.id === selectedOrgId) ?? null, [orgs, selectedOrgId]);

  async function registerAction(actionLabel: string) {
    if (!selected) return;

    const response = await fetch("/api/health/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId: selected.id,
        actionLabel,
        owner: "CSM Squad",
        note: `Acción sugerida desde panel health para ${selected.name}`,
      }),
    });

    const payload = (await response.json()) as { ok: boolean };
    setActionFeedback(payload.ok ? "Acción registrada en log de retención." : "No se pudo registrar la acción.");
  }

  return (
    <main className="space-y-4">
      <section className="card p-5">
        <h1 className="text-2xl font-semibold">Customer Health</h1>
        <p className="text-sm text-zinc-400">Monitoreo de adopción y riesgo para priorizar retención sobre cuentas de mayor impacto.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Adoption score" value={String(summary.adoptionScore)} />
        <MetricCard label="Activity score" value={String(summary.activityScore)} />
        <MetricCard label="Conversion trend" value={`${summary.conversionTrend}%`} />
        <MetricCard label="Risk level" value={summary.riskLevel.toUpperCase()} risk={summary.riskLevel} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="card p-4">
          <h2 className="text-lg font-semibold">Portafolio de organizaciones</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Cuenta</th>
                  <th className="px-3 py-2">Segmento</th>
                  <th className="px-3 py-2">Riesgo</th>
                  <th className="px-3 py-2">Motivo principal</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr
                    key={org.id}
                    onClick={() => setSelectedOrgId(org.id)}
                    className={`cursor-pointer border-t border-white/10 ${selected?.id === org.id ? "bg-[#d4e83a]/10" : "bg-transparent hover:bg-white/[0.02]"}`}
                  >
                    <td className="px-3 py-2 font-medium">{org.name}</td>
                    <td className="px-3 py-2 text-zinc-400">{org.segment}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${riskBadge(org.riskLevel)}`}>{org.riskLevel}</span>
                    </td>
                    <td className="px-3 py-2 text-zinc-400">{org.reasons[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-semibold">Drilldown</h2>
          {!selected ? (
            <p className="mt-3 text-sm text-zinc-400">Selecciona una cuenta para ver diagnóstico y acciones sugeridas.</p>
          ) : (
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-sm font-semibold">{selected.name}</p>
                <p className="text-xs text-zinc-500">MRR ${selected.mrrUsd} · Última actividad {new Date(selected.lastActivityAt).toLocaleString("es-ES")}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Razones de health</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-300">
                  {selected.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Acciones sugeridas</p>
                {selected.suggestedActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => registerAction(action)}
                    className="w-full rounded-lg border border-[#d4e83a]/35 bg-[#d4e83a]/10 px-3 py-2 text-left text-sm text-zinc-100 hover:bg-[#d4e83a]/15"
                  >
                    {action}
                  </button>
                ))}
              </div>
              {actionFeedback ? <p className="text-xs text-zinc-400">{actionFeedback}</p> : null}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function MetricCard({ label, value, risk }: { label: string; value: string; risk?: "green" | "yellow" | "red" }) {
  return (
    <article className="card p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${risk === "red" ? "text-rose-300" : risk === "yellow" ? "text-amber-200" : "text-[#d4e83a]"}`}>{value}</p>
    </article>
  );
}

function riskBadge(risk: "green" | "yellow" | "red") {
  if (risk === "green") return "bg-emerald-400/15 text-emerald-300";
  if (risk === "yellow") return "bg-amber-300/15 text-amber-200";
  return "bg-rose-400/15 text-rose-300";
}
