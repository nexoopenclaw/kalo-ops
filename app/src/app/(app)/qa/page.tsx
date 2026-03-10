import Link from "next/link";

const checks = [
  { module: "Adapter runtime abstraction", status: "PASS", detail: "Contrato unificado mock/live para Meta, WhatsApp, Email, Stripe y Calendly con matriz de capacidades." },
  { module: "Webhook replay tooling", status: "PASS", detail: "Endpoints /api/webhooks/replay y /api/webhooks/replay/batch con dry-run determinista." },
  { module: "Backoff strategy visibility", status: "PASS", detail: "Configuración exponencial+jitter visible en /ops y usada por replay." },
  { module: "Attribution explainability", status: "PASS", detail: "Matcher DM→content determinista + endpoint /api/attribution/explain/[leadId]." },
  { module: "Integraciones + Ops UI", status: "PASS", detail: "Modo mock/live, salud de adapters y último error visibles en UI premium dark." },
  { module: "Theme consistency", status: "PASS", detail: "Copy en español y acento #d4e83a en componentes nuevos." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 21</h1>
        <p className="text-sm text-zinc-400">Checklist de adapter runtime, replay y attribution explainability.</p>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Estado por módulo</h2>
        <div className="mt-3 space-y-2">{checks.map((item) => <div key={item.module} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm"><p className="font-semibold">{item.module} · <span className="text-[#d4e83a]">{item.status}</span></p><p className="text-zinc-400">{item.detail}</p></div>)}</div>
      </section>

      <section className="card p-4 text-sm">
        <h2 className="text-lg font-semibold">Pruebas manuales rápidas</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-300">
          <li>
            Probar <code>POST /api/webhooks/replay</code> con <code>{`{"eventId":"<id>","dryRun":true}`}</code> y validar hash determinista.
          </li>
          <li>Probar <code>POST /api/webhooks/replay/batch</code> con 2-3 items y verificar resumen success/failed.</li>
          <li>Abrir <Link href="/ops" className="text-[#d4e83a] underline">/ops</Link> y validar bloque de backoff + adapters + replay dry-run.</li>
          <li>Abrir <Link href="/integraciones" className="text-[#d4e83a] underline">/integraciones</Link> y validar modo mock/live, health y último error.</li>
          <li>Probar <code>GET /api/attribution/explain/lead_1</code> y revisar score + reasons.</li>
          <li>Enviar mensaje desde Inbox/API y confirmar que sale vía adapter runtime (provider + mode en respuesta).</li>
          <li>Revisar docs <code>docs/SPRINT_21_ADAPTER_RUNTIME.md</code>.</li>
        </ol>
      </section>
    </main>
  );
}
