import Link from "next/link";

const checks = [
  { module: "Experimentos A/B", status: "PASS", detail: "Wizard, assignment determinístico, outcomes, estados y dashboard activos." },
  { module: "Voice Notes", status: "PASS", detail: "Auditoría de preview/send + guardrail de consentimiento explícito + revocación." },
  { module: "Attribution", status: "PASS", detail: "Librería de contenido, métricas por pieza, ranking hooks y tabla $/pieza sortable." },
  { module: "Reporting", status: "PASS", detail: "Daily/Weekly previews + panel de alertas + exports mock PDF/CSV." },
  { module: "API & persistencia", status: "PASS", detail: "Repositorio compartido in-memory + schema consistente ok/error." },
  { module: "UX premium dark", status: "PASS", detail: "Paleta oscura consistente con #d4e83a y copy en español." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 10</h1>
        <p className="text-sm text-zinc-400">Checklist operativo para validar aceptación PRD antes de deploy.</p>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Estado por módulo</h2>
        <div className="mt-3 space-y-2">
          {checks.map((item) => (
            <div key={item.module} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
              <p className="font-semibold">{item.module} · <span className="text-[#d4e83a]">{item.status}</span></p>
              <p className="text-zinc-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4 text-sm">
        <h2 className="text-lg font-semibold">Pruebas manuales rápidas</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-300">
          <li>Ir a <Link href="/attribution" className="text-[#d4e83a] underline">/attribution</Link> y validar cards por pieza + ranking + tabla sortable.</li>
          <li>GET <code>/api/attribution/content</code> y <code>/api/attribution/summary</code> devuelven <code>{`{ ok: true, data }`}</code>.</li>
          <li>POST <code>/api/attribution/link-lead</code> con leadId/contentPieceId válidos crea vínculo; inválidos devuelven <code>{`{ ok: false, error }`}</code>.</li>
          <li>Ir a <Link href="/reportes" className="text-[#d4e83a] underline">/reportes</Link> y validar Daily Digest, Weekly Review, Alert Rules y exports mock.</li>
          <li>GET <code>/api/reports/daily-preview</code> + <code>/api/reports/weekly-preview</code> y POST <code>/api/reports/alerts/upsert</code> responden esquema consistente.</li>
        </ol>
      </section>
    </main>
  );
}
