import Link from "next/link";

const checks = [
  { module: "Supabase schema + RLS", status: "PASS", detail: "Sprint 17 migration adds multi-tenant tables, helper functions and role-aware RLS policies." },
  { module: "Auth + org context", status: "PASS", detail: "API routes require bearer token and resolve active org membership with single-org fallback." },
  { module: "RBAC guard layer", status: "PASS", detail: "Sprint 18 adds requireRole/canAccessLead/canTransitionDeal and applies them to leads/deals/automations/inbox APIs." },
  { module: "Leads API", status: "PASS", detail: "/api/leads/list + /api/leads/create now enforce role checks and consistent error schema." },
  { module: "Deals API", status: "PASS", detail: "/api/deals/update-stage + /api/deals/upsert-note now validate role and transition permissions." },
  { module: "Automations API", status: "PASS", detail: "Create/toggle/execute/queue routes now enforce owner/admin or operator roles server-side." },
  { module: "Realtime inbox backbone", status: "PASS", detail: "Inbox workspace mounts Supabase channel scaffold + fallback polling with connection badge." },
  { module: "Presence + assignment", status: "PASS", detail: "Inbox sidebar shows presence hints and new assignment ping endpoint is available." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 18</h1>
        <p className="text-sm text-zinc-400">Checklist de RBAC enforcement + realtime inbox backbone.</p>
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
          <li>Con rol <code>viewer</code>: GET <code>/api/leads/list?limit=10</code> y <code>/api/inbox/conversations</code> OK; POST mutaciones debe devolver <code>RBAC_FORBIDDEN</code>.</li>
          <li>Con rol <code>setter</code>: POST <code>/api/deals/update-stage</code> a <code>won/lost</code> debe bloquear según reglas.</li>
          <li>Con rol <code>admin</code>: POST <code>/api/automations/create</code> y <code>/api/automations/queue/enqueue</code> deben responder 201.</li>
          <li>En <Link href="/inbox" className="text-[#d4e83a] underline">/inbox</Link> validar badge realtime: connected/degraded/offline según estado de canal.</li>
          <li>Validar endpoints nuevos: <code>/api/inbox/presence</code> y <code>/api/inbox/assignment-ping</code>.</li>
          <li>Revisar <Link href="/docs" className="text-[#d4e83a] underline">documentación</Link>: <code>SPRINT_18_RBAC_REALTIME.md</code>.</li>
        </ol>
      </section>
    </main>
  );
}
