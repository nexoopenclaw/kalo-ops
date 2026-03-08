import Link from "next/link";

const checks = [
  { module: "Supabase schema + RLS", status: "PASS", detail: "Sprint 17 migration adds multi-tenant tables, helper functions and role-aware RLS policies." },
  { module: "Auth + org context", status: "PASS", detail: "API routes require bearer token and resolve active org membership with single-org fallback." },
  { module: "Leads API", status: "PASS", detail: "/api/leads/list + /api/leads/create now run through Supabase repositories." },
  { module: "Deals API", status: "PASS", detail: "/api/deals/update-stage writes deal + stage history; /api/deals/upsert-note persists notes/objections." },
  { module: "Automations API", status: "PASS", detail: "Create/toggle/execute routes persist against public.automations + automation_executions." },
  { module: "Webhook reliability", status: "PASS", detail: "Webhook process/events endpoints persist idempotent events in public.webhook_events." },
  { module: "Bootstrap docs", status: "PASS", detail: "docs/SUPABASE_BOOTSTRAP.md added with exact migration/owner linkage workflow." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 17</h1>
        <p className="text-sm text-zinc-400">Checklist de backend Supabase + RLS multitenant.</p>
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
          <li>Añadir <code>Authorization: Bearer &lt;jwt&gt;</code> y opcional <code>x-org-id</code> en requests API.</li>
          <li>GET <code>/api/leads/list?limit=10</code> debe devolver solo filas del org activo (RLS).</li>
          <li>POST <code>/api/leads/create</code> crea lead y respeta unique (organization_id, email).</li>
          <li>POST <code>/api/deals/update-stage</code> actualiza stage + inserta fila en <code>deal_stage_history</code>.</li>
          <li>POST <code>/api/automations/create</code> y <code>/api/automations/toggle</code> persisten en Supabase.</li>
          <li>Revisar <Link href="/docs" className="text-[#d4e83a] underline">documentación</Link>: <code>SUPABASE_BOOTSTRAP.md</code> y <code>SPRINT_17_SUPABASE_BACKEND.md</code>.</li>
        </ol>
      </section>
    </main>
  );
}
