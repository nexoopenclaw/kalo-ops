import Link from "next/link";

const checks = [
  { module: "Hoy Command Center", status: "PASS", detail: "Ruta /hoy activa en navegación con vista unificada de operación diaria." },
  { module: "Revenue Bridge panel", status: "PASS", detail: "Panel operativo en /hoy con eventos Calendly/Stripe, transiciones y métricas fail/ignored." },
  { module: "Bridge service", status: "PASS", detail: "src/lib/revenue-bridge-service.ts implementa idempotencia + mapeo a deal stage." },
  { module: "Webhook Calendly", status: "PASS", detail: "POST /api/webhooks/calendly con parser seguro, firma placeholder y handling NOT_CONFIGURED." },
  { module: "Webhook Stripe", status: "PASS", detail: "POST /api/webhooks/stripe con parser seguro, firma placeholder y handling NOT_CONFIGURED." },
  { module: "Deal stage history", status: "PASS", detail: "Bridge reutiliza crmService.updateDealStage y agrega nota auditada en deal." },
  { module: "Schema Sprint 15", status: "PASS", detail: "Tablas integration_event_log y bridge_transitions con índices + RLS stubs." },
  { module: "UX premium dark", status: "PASS", detail: "Visual dark consistente con acento #d4e83a y copy operacional en español." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 15</h1>
        <p className="text-sm text-zinc-400">Checklist operativo del cockpit + Revenue Bridge antes de deploy.</p>
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
        <h2 className="text-lg font-semibold">Bloque de aceptación · Keys-ready</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-300">
          <li>
            Ir a <Link href="/integraciones" className="text-[#d4e83a] underline">/integraciones</Link> y validar estado por proveedor (Configurado/Missing).
          </li>
          <li>
            GET <code>/api/integrations/status</code> debe devolver lista completa de proveedores y <code>missingKeys</code> sin exponer secretos.
          </li>
          <li>
            POST <code>/api/integrations/test/:provider</code> debe responder <code>ok=true</code> con <code>status=ok</code> o <code>status=not_configured</code> de forma graceful.
          </li>
          <li>
            Revisar <code>docs/GO_LIVE_KEYS_CHECKLIST.md</code> para checklist de carga en Vercel + Supabase y smoke tests iniciales.
          </li>
        </ol>
      </section>

      <section className="card p-4 text-sm">
        <h2 className="text-lg font-semibold">Pruebas manuales rápidas</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-300">
          <li>
            Ir a <Link href="/hoy" className="text-[#d4e83a] underline">/hoy</Link> y validar bloque nuevo <strong>Revenue Bridge</strong> (eventos, transiciones, fallidos/ignorados).
          </li>
          <li>
            POST <code>/api/webhooks/calendly</code> con header <code>x-kalo-mock-signature: dev-ok</code> + payload ejemplo: deal pasa a <code>booked</code>.
          </li>
          <li>
            POST <code>/api/webhooks/stripe</code> con header <code>x-kalo-mock-signature: dev-ok</code> + payload ejemplo: deal pasa a <code>won</code>.
          </li>
          <li>
            Reenviar mismo <code>external_event_id</code> y validar idempotencia (status ignored / sin transición duplicada).
          </li>
          <li>
            Confirmar que <code>/api/hoy/summary</code> incluye <code>revenueBridge</code> en el payload y que el style dark premium + <code>#d4e83a</code> se mantiene.
          </li>
        </ol>
      </section>
    </main>
  );
}
