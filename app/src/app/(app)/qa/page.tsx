import Link from "next/link";

const checks = [
  { module: "Delivery orchestrator", status: "PASS", detail: "Pipeline provider-agnostic con email/whatsapp/slack + historial de intentos y retry." },
  { module: "Automation execution audit", status: "PASS", detail: "Trail robusto con inputs/decisions/outputs/duración/correlation id y endpoint /api/automations/audit." },
  { module: "Attribution fallback mappings", status: "PASS", detail: "Heurística determinista reforzada + tabla de mappings fallback vía /api/attribution/mappings." },
  { module: "Feature flags go-live", status: "PASS", detail: "Registro env + override para webhooks live, outbound live y automations live execute; visible en /ops." },
  { module: "Theme consistency", status: "PASS", detail: "Copy en español y acento #d4e83a en secciones nuevas." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 22</h1>
        <p className="text-sm text-zinc-400">Checklist de delivery orchestration, audit trail, attribution fallback y safety flags.</p>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Estado por módulo</h2>
        <div className="mt-3 space-y-2">{checks.map((item) => <div key={item.module} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm"><p className="font-semibold">{item.module} · <span className="text-[#d4e83a]">{item.status}</span></p><p className="text-zinc-400">{item.detail}</p></div>)}</div>
      </section>

      <section className="card p-4 text-sm">
        <h2 className="text-lg font-semibold">Pruebas manuales rápidas</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-300">
          <li>Probar <code>POST /api/delivery/send-test</code> con canales email/whatsapp/slack y validar status/mode/correlationId.</li>
          <li>Probar <code>GET /api/delivery/history?organizationId=org_1</code> y confirmar intentos recientes.</li>
          <li>Ejecutar trigger en <Link href="/automations" className="text-[#d4e83a] underline">/automations</Link> y verificar sección "Audit trail" + <code>/api/automations/audit</code>.</li>
          <li>Probar <code>GET/POST /api/attribution/mappings</code> y luego <code>/api/attribution/explain/lead_1</code>.</li>
          <li>Abrir <Link href="/ops" className="text-[#d4e83a] underline">/ops</Link> y validar flags live/mock + source.</li>
          <li>Con flags OFF, validar respuesta mock segura en <code>/api/webhooks/process</code> y <code>/api/channels/send</code>.</li>
          <li>Revisar docs <code>docs/SPRINT_22_DELIVERY_ATTRIBUTION_FLAGS.md</code>.</li>
        </ol>
      </section>
    </main>
  );
}
