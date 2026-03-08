import { dashboardStats, pipeline } from "@/data/mock";

export default function DashboardPage() {
  return (
    <main className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((item) => (
          <article key={item.label} className="card p-4">
            <p className="text-xs text-zinc-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            <span className="badge-accent mt-3 inline-flex rounded-full px-2 py-0.5 text-xs">{item.delta}</span>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <article className="card p-5">
          <h3 className="text-lg font-semibold">Pipeline overview</h3>
          <p className="text-sm text-zinc-400">Mock seed · actualizar con datos reales vía Supabase</p>
          <div className="mt-4 space-y-3">
            {pipeline.map((row) => (
              <div key={row.stage}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{row.stage}</span>
                  <span className="text-zinc-400">
                    {row.count} deals · ${row.amount.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#d4e83a]"
                    style={{ width: `${Math.min(100, row.count * 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card p-5">
          <h3 className="text-lg font-semibold">Focus Sprint 1</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            <li>• Inbox unificado con priorización de lead scoring.</li>
            <li>• CRM pipeline para setters y closers.</li>
            <li>• Trazabilidad por contenido (attribution-lite).</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
