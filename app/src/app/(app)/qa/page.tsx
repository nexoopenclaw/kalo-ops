import Link from "next/link";

const checks = [
  { module: "Automation executor", status: "PASS", detail: "src/lib/automation-executor.ts ejecuta trigger/conditions/actions contra estado in-memory." },
  { module: "Acciones soportadas", status: "PASS", detail: "send_message, change_status, assign_setter, notify, add_tag con resultado por acción." },
  { module: "Execution logs", status: "PASS", detail: "Logs con status, razón, duración (ms), timestamps y trigger payload." },
  { module: "Queue reliability", status: "PASS", detail: "src/lib/automation-queue.ts con retry metadata (retryCount, maxRetries, nextRetryAt, lastError)." },
  { module: "Automation APIs", status: "PASS", detail: "Nuevos endpoints execute / queue enqueue/run-next / executions / queue status." },
  { module: "Execution Center UI", status: "PASS", detail: "Nueva sección en /automations con métricas de cola, tabla reciente y trigger manual safe mock." },
  { module: "Schema Sprint 16", status: "PASS", detail: "Tablas automation_executions + automation_queue con índices y stubs RLS por organization_id." },
  { module: "UX premium dark", status: "PASS", detail: "Estética dark consistente, acento #d4e83a y copy operacional en español." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 16</h1>
        <p className="text-sm text-zinc-400">Checklist de fiabilidad para Automation Executor + Queue.</p>
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
            Ir a <Link href="/automations" className="text-[#d4e83a] underline">/automations</Link> y validar bloque <strong>Execution Center</strong>.
          </li>
          <li>
            Ejecutar trigger manual (safe mock) y confirmar nueva fila en tabla de ejecuciones.
          </li>
          <li>
            Encolar job con <strong>Encolar + run-next</strong> y verificar métricas: pending/running/failed.
          </li>
          <li>
            GET <code>/api/automations/executions?organizationId=org_1</code> devuelve logs con <code>durationMs</code> y <code>reason</code>.
          </li>
          <li>
            GET <code>/api/automations/queue/status?organizationId=org_1</code> refleja estado de cola y reintentos.
          </li>
          <li>
            Revisar <code>docs/SPRINT_16_AUTOMATION_EXECUTOR.md</code> para runbook completo antes de deploy.
          </li>
        </ol>
      </section>
    </main>
  );
}
