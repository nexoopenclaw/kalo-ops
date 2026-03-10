import Link from "next/link";

const checks = [
  { module: "Bridge schemas y validadores", status: "PASS", detail: "Validaciones estrictas para payloads de Calendly y Stripe con taxonomía de dead-letter reasons." },
  { module: "Idempotencia determinista", status: "PASS", detail: "Helper de idempotency key + manejo explícito de conflictos por payload diferente." },
  { module: "Transition guards", status: "PASS", detail: "Reglas anti-regresión en revenue bridge (ej. won/lost no vuelven atrás)." },
  { module: "Simulator E2E", status: "PASS", detail: "Nueva ruta /simulator y API /api/simulator/revenue-loop/run para flujo booking→payment." },
  { module: "Observability pack", status: "PASS", detail: "Correlation IDs en webhooks y endpoint /api/ops/diagnostics con snapshot operativo." },
  { module: "Data consistency checks", status: "PASS", detail: "Servicio integrity checker + endpoint /api/ops/integrity-check con fixes sugeridos." },
  { module: "Ops diagnostics panel", status: "PASS", detail: "Panel ligero en /ops con fallos recientes por categoría e integrity summary." },
  { module: "Theme consistency", status: "PASS", detail: "UI premium dark + acento #d4e83a y copy en español." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 20</h1>
        <p className="text-sm text-zinc-400">Checklist de revenue loop hardening, observabilidad y consistencia de datos.</p>
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
          <li>Probar <code>POST /api/webhooks/calendly</code> con payload válido e inválido; validar dead-letter reason en inválidos.</li>
          <li>Probar <code>POST /api/webhooks/stripe</code> duplicando mismo event id con payload alterado para confirmar <code>IDEMPOTENCY_CONFLICT</code>.</li>
          <li>Abrir <Link href="/simulator" className="text-[#d4e83a] underline">/simulator</Link> y ejecutar flujo completo booking + payment para un deal mock.</li>
          <li>Confirmar transición de etapa y <code>stageHistory</code> en respuesta de <code>/api/simulator/revenue-loop/run</code>.</li>
          <li>Consultar <code>GET /api/ops/diagnostics</code> y validar worker status, backlog, bridge stats y latest failures.</li>
          <li>Consultar <code>GET /api/ops/integrity-check</code> y revisar issues + suggested fixes.</li>
          <li>Validar panel <Link href="/ops" className="text-[#d4e83a] underline">/ops</Link> en bloque "Panel diagnóstico".</li>
          <li>Revisar docs <code>docs/SPRINT_20_REVENUE_LOOP.md</code>.</li>
        </ol>
      </section>
    </main>
  );
}
