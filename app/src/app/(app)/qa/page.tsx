import Link from "next/link";

const checks = [
  { module: "Digest engine daily/weekly", status: "PASS", detail: "Servicio nuevo compone hoy+crm+inbox+risk+attribution y genera plantillas accionables en español." },
  { module: "Digest APIs", status: "PASS", detail: "Disponibles /api/digest/daily/preview, /weekly/preview, /run y /runs con RBAC." },
  { module: "Worker runtime", status: "PASS", detail: "Worker ligero con tick manual y status; integra automation queue + webhook retry + digest queue." },
  { module: "Hardening rate limits", status: "PASS", detail: "Rate limiting añadido a webhooks críticos y ejecución de automations." },
  { module: "Structured logs", status: "PASS", detail: "Logger con request id y redacción segura para headers/campos sensibles." },
  { module: "Ops diagnostics panel", status: "PASS", detail: "/ops muestra worker depth, backlog webhook retry y último digest run." },
  { module: "Schema sprint 19", status: "PASS", detail: "Migración agrega digest_runs + worker_jobs con índices y stubs RLS por org." },
  { module: "Theme consistency", status: "PASS", detail: "UI conserva premium dark y acento #d4e83a con copy en español." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 19</h1>
        <p className="text-sm text-zinc-400">Checklist de digest engine, worker scaffold y hardening sin claves.</p>
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
          <li>Con Bearer JWT + <code>x-org-id</code>, probar <code>GET /api/digest/daily/preview</code> y <code>/weekly/preview</code>.</li>
          <li>Ejecutar <code>POST /api/digest/run</code> con body <code>{`{"type":"daily"}`}</code> y validar respuesta con <code>run.id</code>.</li>
          <li>Ejecutar <code>POST /api/digest/run</code> con <code>{`{"type":"weekly","enqueue":true}`}</code> y luego <code>POST /api/worker/tick</code>.</li>
          <li>Consultar <code>GET /api/digest/runs</code> y confirmar historial + schedule scaffold.</li>
          <li>Consultar <code>GET /api/worker/status</code> y validar depth de automation/webhook/digest.</li>
          <li>Disparar ráfaga contra <code>/api/automations/execute</code> o webhooks y confirmar <code>429 RATE_LIMITED</code>.</li>
          <li>Revisar logs server para eventos estructurados con <code>requestId</code> y campos sensibles redactados.</li>
          <li>Verificar panel <Link href="/ops" className="text-[#d4e83a] underline">/ops</Link> en bloque "Diagnóstico operativo".</li>
          <li>Revisar documentación <code>docs/SPRINT_19_NO_KEYS_HARDENING.md</code>.</li>
        </ol>
      </section>
    </main>
  );
}
