import Link from "next/link";

const checks = [
  { module: "Onboarding workspace", status: "PASS", detail: "Ruta /onboarding con checklist guiado, barra de progreso, ETA y quick-start dinámico." },
  { module: "Persistencia onboarding", status: "PASS", detail: "Estado de completado por tarea persistido en memoria compartida vía onboarding-service." },
  { module: "Customer Health dashboard", status: "PASS", detail: "Ruta /health con cards de adoption/activity/conversion/risk + tabla de cuentas." },
  { module: "Drilldown y acciones", status: "PASS", detail: "Drawer/panel de detalle por org con razones de riesgo y acciones sugeridas registrables." },
  { module: "APIs Sprint 13", status: "PASS", detail: "Endpoints /api/onboarding/state, /check, /api/health/summary, /orgs y /action con schema consistente." },
  { module: "Schema extension", status: "PASS", detail: "Tablas onboarding_states, customer_health_snapshots y health_actions_log con índices + stubs RLS." },
  { module: "UX premium dark", status: "PASS", detail: "Sistema dark consistente + acento #d4e83a y copy operativo en español." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 13</h1>
        <p className="text-sm text-zinc-400">Checklist de onboarding + customer health + retention ops antes de deploy.</p>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Estado por módulo</h2>
        <div className="mt-3 space-y-2">
          {checks.map((item) => (
            <div key={item.module} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
              <p className="font-semibold">
                {item.module} · <span className="text-[#d4e83a]">{item.status}</span>
              </p>
              <p className="text-zinc-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4 text-sm">
        <h2 className="text-lg font-semibold">Pruebas manuales rápidas</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-300">
          <li>
            Ir a <Link href="/onboarding" className="text-[#d4e83a] underline">/onboarding</Link> y marcar/desmarcar tareas; validar que progreso, ETA y quick-start se actualizan en tiempo real.
          </li>
          <li>
            GET <code>/api/onboarding/state</code> debe responder <code>{`{ ok: true, data: { state, tasks, progress } }`}</code>.
          </li>
          <li>
            POST <code>/api/onboarding/check</code> con <code>{`{ taskKey, checked }`}</code> debe persistir estado y devolver progreso recalculado.
          </li>
          <li>
            Ir a <Link href="/health" className="text-[#d4e83a] underline">/health</Link> y validar cards de score/riesgo + tabla de organizaciones con razones visibles.
          </li>
          <li>
            Seleccionar una org y ejecutar una acción sugerida; POST <code>/api/health/action</code> debe devolver <code>{`{ ok: true, data }`}</code> status 201.
          </li>
          <li>
            GET <code>/api/health/summary</code> y <code>/api/health/orgs</code> deben reflejar portfolio mock con risk-level green/yellow/red.
          </li>
        </ol>
      </section>
    </main>
  );
}
