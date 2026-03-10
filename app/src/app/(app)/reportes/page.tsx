import { attributionService } from "@/lib/attribution-service";
import { reportingService } from "@/lib/reporting-service";

const exportsMock = ["Exportar PDF", "Exportar CSV"];
const alertRuleLabels: Record<string, string> = {
  vip_no_response: "VIP sin respuesta",
  show_up_drop: "Caída de show-up rate",
  inbound_spike: "Spike de inbound",
  backlog: "Backlog operativo",
};

export default async function ReportesPage() {
  const [daily, weekly, alerts, commercial, attributionPerf] = await Promise.all([
    attributionService.getDailyPreview("org_1"),
    attributionService.getWeeklyPreview("org_1"),
    attributionService.listAlertRules("org_1"),
    reportingService.commercialPerformance("org_1"),
    reportingService.attributionPerformance("org_1"),
  ]);

  return (
    <main className="space-y-4">
      <section className="card p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Phase 4 · Reporting Foundation</p>
        <h1 className="mt-1 text-2xl font-semibold">Reportes</h1>
        <p className="mt-1 text-sm text-zinc-400">Digest diario, review semanal y alertas operativas accionables.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-4">
          <h2 className="text-lg font-semibold">Daily Digest (preview)</h2>
          <p className="mt-1 text-sm text-zinc-400">{daily.summary}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            {daily.highlights.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="mt-3 text-sm text-[#d4e83a]">Leads {daily.kpis.leads} · Calls {daily.kpis.callsBooked} · Won {daily.kpis.dealsWon} · ${daily.kpis.attributedRevenue.toLocaleString("es-ES")}</p>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-semibold">Weekly Review (preview)</h2>
          <p className="mt-1 text-sm text-zinc-400">{weekly.summary}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <p className="font-medium text-zinc-100">Wins</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-zinc-300">
                {weekly.wins.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-medium text-zinc-100">Riesgos</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-zinc-300">
                {weekly.risks.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-4">
          <h2 className="text-lg font-semibold">Performance comercial consolidado</h2>
          <p className="mt-2 text-sm text-zinc-300">Creados {commercial.totals.created} · Booked {commercial.totals.booked} · Won {commercial.totals.won}</p>
          <p className="text-sm text-zinc-400">Conv booked {commercial.totals.bookingRate}% · close {commercial.totals.closeRate}% · valor ganado €{commercial.totals.wonValue.toLocaleString("es-ES")}</p>
          <p className="mt-2 text-xs text-zinc-500">Aging (top): {commercial.aging.slice(0, 3).map((a) => `${a.leadName} ${a.daysOpen}d`).join(" · ") || "sin pendientes"}</p>
        </article>
        <article className="card p-4">
          <h2 className="text-lg font-semibold">Attribution performance</h2>
          <p className="text-sm text-zinc-400">Top contenido por leads/won/value con fallback mapping.</p>
          <div className="mt-2 space-y-1 text-xs">
            {attributionPerf.topContent.slice(0, 5).map((item) => (
              <p key={item.contentPieceId} className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1">{item.platform} · {item.leads} leads · {item.won} won · €{item.value.toLocaleString("es-ES")}</p>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">Fallback mapping: {attributionPerf.fallback.mappedLeads}/{attributionPerf.fallback.inspectedLeads} leads.</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <article className="card p-4">
          <h2 className="text-lg font-semibold">Alert rules</h2>
          <div className="mt-3 space-y-2">
            {alerts.map((rule) => (
              <div key={rule.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                <p className="font-medium text-zinc-100">{alertRuleLabels[rule.ruleType] ?? rule.ruleType}</p>
                <p className="text-zinc-400">Threshold: {rule.threshold} · Ventana: {rule.window}</p>
                <p className={rule.enabled ? "text-[#d4e83a]" : "text-zinc-500"}>{rule.enabled ? "Activa" : "Pausada"}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-semibold">Exports (mock)</h2>
          <div className="mt-3 space-y-2">
            {exportsMock.map((label) => (
              <button key={label} className="w-full rounded-lg border border-[#d4e83a]/35 bg-[#d4e83a]/10 px-3 py-2 text-left text-sm text-[#d4e83a] hover:bg-[#d4e83a]/15">
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">Placeholders listos para conectar render real PDF/CSV.</p>
        </article>
      </section>
    </main>
  );
}
