import { SortableRoiTable } from "@/components/attribution/sortable-roi-table";
import { attributionService } from "@/lib/attribution-service";

const metricLabels = [
  { key: "leadsGenerated", label: "Leads generados" },
  { key: "callsBooked", label: "Calls booked" },
  { key: "dealsWon", label: "Deals won" },
  { key: "attributedRevenue", label: "Revenue atribuido" },
] as const;

export default async function AttributionPage() {
  const [metrics, summary] = await Promise.all([attributionService.listContentMetrics("org_1"), attributionService.getSummary("org_1")]);

  return (
    <main className="space-y-4">
      <section className="card p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Phase 4 · Attribution</p>
        <h1 className="mt-1 text-2xl font-semibold">Content Attribution</h1>
        <p className="mt-1 text-sm text-zinc-400">Librería de piezas + impacto real en pipeline y revenue.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <article className="card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Total leads</p>
          <p className="mt-2 text-2xl font-semibold text-[#d4e83a]">{summary.totals.leadsGenerated}</p>
        </article>
        <article className="card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Calls booked</p>
          <p className="mt-2 text-2xl font-semibold">{summary.totals.callsBooked}</p>
        </article>
        <article className="card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Deals won</p>
          <p className="mt-2 text-2xl font-semibold">{summary.totals.dealsWon}</p>
        </article>
        <article className="card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Revenue atribuido</p>
          <p className="mt-2 text-2xl font-semibold">${summary.totals.attributedRevenue.toLocaleString("es-ES")}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <article className="card p-4">
          <h2 className="text-lg font-semibold">Content library</h2>
          <div className="mt-3 space-y-3">
            {metrics.map((item) => (
              <div key={item.piece.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-100">{item.piece.hook}</p>
                    <p className="text-xs uppercase tracking-wide text-zinc-400">
                      {item.piece.platform} · {item.piece.type} · {new Date(item.piece.publishedAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#d4e83a]/30 bg-[#d4e83a]/10 px-2 py-1 text-xs text-[#d4e83a]">{item.piece.angle}</span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {metricLabels.map((metric) => (
                    <div key={metric.key} className="rounded-lg border border-white/10 bg-[#0d1422] p-2">
                      <p className="text-xs text-zinc-400">{metric.label}</p>
                      <p className="mt-1 font-semibold text-zinc-100">
                        {metric.key === "attributedRevenue" ? `$${item[metric.key].toLocaleString("es-ES")}` : item[metric.key]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-semibold">Ranking de hooks / ángulos</h2>
          <div className="mt-3 space-y-2">
            {summary.topHooks.map((hook, index) => (
              <div key={hook.hook} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
                <p className="font-medium text-zinc-100">#{index + 1} · {hook.hook}</p>
                <p className="text-zinc-400">{hook.angle} · {hook.leads} leads · {hook.dealsWon} wins</p>
                <p className="mt-1 text-[#d4e83a]">${hook.attributedRevenue.toLocaleString("es-ES")}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">$ por pieza · tabla sortable</h2>
        <p className="mb-3 mt-1 text-sm text-zinc-400">Ordena por fecha, plataforma, leads, calls, deals, revenue o ROI por pieza.</p>
        <SortableRoiTable rows={metrics} />
      </section>
    </main>
  );
}
