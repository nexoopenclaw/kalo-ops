import Link from "next/link";

const checks = [
  { module: "Hoy Command Center", status: "PASS", detail: "Ruta /hoy activa en navegación con vista unificada de operación diaria." },
  { module: "Servicio agregador", status: "PASS", detail: "src/lib/hoy-service.ts consolida inbox, CRM, automations, health, webhooks y attribution." },
  { module: "API cockpit", status: "PASS", detail: "GET /api/hoy/summary devuelve payload único para UI y refresco en cliente." },
  { module: "Paneles críticos", status: "PASS", detail: "Incluye prioridades, SLA urgente, deals en riesgo, estado experimentos/automations y alertas top." },
  { module: "Quick actions operativas", status: "PASS", detail: "Bloque de acciones rápidas enlazadas a Inbox, CRM, Automations, Webhooks y QA." },
  { module: "UX premium dark", status: "PASS", detail: "Visual dark consistente con acento #d4e83a y copy operacional en español." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 14</h1>
        <p className="text-sm text-zinc-400">Checklist del cockpit unificado “Hoy” antes de deploy.</p>
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
            Ir a <Link href="/hoy" className="text-[#d4e83a] underline">/hoy</Link> y validar los 5 bloques: prioridades, SLA, deals en riesgo, estado de automations/experimentos y alertas.
          </li>
          <li>
            Click en <strong>Actualizar snapshot</strong>; verificar recarga de datos sin errores visuales.
          </li>
          <li>
            GET <code>/api/hoy/summary</code> debe responder <code>{`{ ok: true, data: { priorities, inboxUrgentQueue, dealsAtRisk, automationStatus, topAlerts, quickActions } }`}</code>.
          </li>
          <li>
            Comprobar que los botones de quick actions redirigen a <code>/inbox</code>, <code>/crm</code>, <code>/automations</code>, <code>/webhooks</code> y <code>/qa</code>.
          </li>
          <li>
            Revisar que el copy y estilo mantienen modo dark premium con acento <code>#d4e83a</code>.
          </li>
        </ol>
      </section>
    </main>
  );
}
