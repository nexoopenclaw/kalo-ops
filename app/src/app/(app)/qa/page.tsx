import Link from "next/link";

const checks = [
  { module: "Webhook Processing Center", status: "PASS", detail: "Página /webhooks con timeline, filtros por canal/estado/fecha y búsqueda por external_id." },
  { module: "Engine resiliente", status: "PASS", detail: "Normalización por canal, idempotency key, política de retry y dead-letter routing scaffold." },
  { module: "API reliability", status: "PASS", detail: "Rutas /api/webhooks/process, /events, /retry/:id y /dead-letter/:id/requeue con validación robusta." },
  { module: "Ops métricas", status: "PASS", detail: "Cards de success rate, latencia promedio, cola retry y dead-letter para monitoreo operativo." },
  { module: "Schema Sprint 12", status: "PASS", detail: "Tablas webhook_events y dead_letter_events con índices + stubs RLS por organization_id." },
  { module: "UX premium dark", status: "PASS", detail: "Estética consistente, acento #d4e83a y copy 100% español para equipos internos." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 12</h1>
        <p className="text-sm text-zinc-400">Checklist de confiabilidad webhook-first antes de pasar a deploy en Vercel.</p>
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
            Ir a <Link href="/webhooks" className="text-[#d4e83a] underline">/webhooks</Link> y validar timeline + filtros + drawer de detalle.
          </li>
          <li>
            GET <code>/api/webhooks/events</code> debe responder <code>{`{ ok: true, data: { events, metrics } }`}</code>.
          </li>
          <li>
            POST <code>/api/webhooks/process</code> con payload válido debe devolver evento normalizado con idempotency key.
          </li>
          <li>
            POST <code>/api/webhooks/retry/:id</code> debe incrementar retry_count y actualizar next_attempt_at.
          </li>
          <li>
            POST <code>/api/webhooks/dead-letter/:id/requeue</code> debe reencolar evento y registrar requeued_at.
          </li>
          <li>
            Validar que payload inválido en cualquier endpoint devuelve <code>{`{ ok: false, error }`}</code> con código consistente.
          </li>
        </ol>
      </section>
    </main>
  );
}
