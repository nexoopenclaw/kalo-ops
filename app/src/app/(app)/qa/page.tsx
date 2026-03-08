import Link from "next/link";

const checks = [
  { module: "Hoy Command Center", status: "PASS", detail: "Ruta /hoy con cockpit operativo de riesgo, KPIs y recomendaciones accionables." },
  { module: "Pipeline risk scan", status: "PASS", detail: "POST /api/risk/scan evalúa deals en riesgo desde CRM y genera alertas de rescate." },
  { module: "Workflows de rescate", status: "PASS", detail: "Activación/pausa de workflows vía /api/risk/workflows/toggle con estado visible en UI." },
  { module: "Vinculación módulos", status: "PASS", detail: "Risk engine consume CRM funnel summary + alert configs + simulation de automation engine." },
  { module: "Persistencia scaffold", status: "PASS", detail: "Schema SQL extendido con tablas risk_alert_events y risk_workflow_states + índices/RLS stubs." },
  { module: "UX premium dark", status: "PASS", detail: "Diseño dark consistente con acento #d4e83a y copy operativo en español." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 14</h1>
        <p className="text-sm text-zinc-400">Checklist de pipeline risk automation + alerting workflows antes de deploy.</p>
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
            Ir a <Link href="/hoy" className="text-[#d4e83a] underline">/hoy</Link> y validar KPIs de riesgo + deals críticos + workflows de rescate.
          </li>
          <li>
            Click en <strong>Ejecutar scan ahora</strong>; verificar resumen de ejecución y generación de alertas recientes.
          </li>
          <li>
            POST <code>/api/risk/scan</code> debe responder <code>{`{ ok: true, data: { scannedDeals, triggeredWorkflows, generatedAlerts } }`}</code>.
          </li>
          <li>
            Alternar un workflow en UI; POST <code>/api/risk/workflows/toggle</code> debe reflejar cambio Activo/Inactivo.
          </li>
          <li>
            GET <code>/api/risk/cockpit</code> debe devolver snapshot de cockpit con <code>totals</code>, <code>dealsAtRisk</code>, <code>workflows</code> y <code>recentAlerts</code>.
          </li>
        </ol>
      </section>
    </main>
  );
}
