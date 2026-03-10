import Link from "next/link";

const checks = [
  { module: "Worker reliability v2", status: "PASS", detail: "Jobs persistidos en store in-memory con lease/lock, retryCount y nextAttemptAt." },
  { module: "Observabilidad/control de jobs", status: "PASS", detail: "Nuevos endpoints /api/worker/jobs y /api/worker/jobs/[id]/requeue." },
  { module: "Outbound safeguards", status: "PASS", detail: "Idempotency keys para /api/delivery/send-test y /api/channels/send + dry-run global por org." },
  { module: "Reporting upgrade", status: "PASS", detail: "Endpoints /api/reports/commercial-performance y /api/reports/attribution-performance." },
  { module: "UX Ops/Reportes", status: "PASS", detail: "Secciones nuevas en español para reliability, safeguards y performance comercial/attribution." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 23</h1>
        <p className="text-sm text-zinc-400">Checklist de reliability, safeguards outbound y reporting comercial listo para go-live.</p>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Estado por módulo</h2>
        <div className="mt-3 space-y-2">{checks.map((item) => <div key={item.module} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm"><p className="font-semibold">{item.module} · <span className="text-[#d4e83a]">{item.status}</span></p><p className="text-zinc-400">{item.detail}</p></div>)}</div>
      </section>

      <section className="card p-4 text-sm">
        <h2 className="text-lg font-semibold">Pruebas manuales rápidas</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-300">
          <li>Probar <code>POST /api/worker/tick</code> y luego <code>GET /api/worker/jobs?status=failed</code>.</li>
          <li>Reencolar un job con <code>POST /api/worker/jobs/[id]/requeue</code> y validar estado pending.</li>
          <li>Enviar 2 veces el mismo payload con igual <code>idempotencyKey</code> en <code>/api/delivery/send-test</code>; la segunda debe devolver deduplicated.</li>
          <li>Con dry-run global activo, validar que <code>/api/channels/send</code> responde mock aunque el flag live esté ON.</li>
          <li>Revisar <code>/api/reports/commercial-performance</code> y <code>/api/reports/attribution-performance</code>.</li>
          <li>Validar UI en <Link href="/ops" className="text-[#d4e83a] underline">/ops</Link> y <Link href="/reportes" className="text-[#d4e83a] underline">/reportes</Link>.</li>
          <li>Revisar doc <code>docs/SPRINT_23_RELIABILITY_REPORTING.md</code>.</li>
        </ol>
      </section>
    </main>
  );
}
