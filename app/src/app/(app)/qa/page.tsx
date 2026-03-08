import Link from "next/link";

const checks = [
  { module: "Inbox multicanal", status: "PASS", detail: "Tabs por canal, cola unificada y cards con canal/owner/SLA/unread/etapa." },
  { module: "Thread enriquecido", status: "PASS", detail: "Badges por tipo de mensaje (texto, voz, imagen, sistema) + iconografía de canal fuente." },
  { module: "Adapters y dispatcher", status: "PASS", detail: "Arquitectura tipada en src/lib/channel-adapters con mocks por Instagram, WhatsApp y Email." },
  { module: "API multicanal", status: "PASS", detail: "Rutas /api/channels/send, /inbound y /health con validación y formato consistente ok/error." },
  { module: "Ops operativo", status: "PASS", detail: "Página /ops con health, queue depth, brechas SLA, backlog y acciones rápidas mock." },
  { module: "UX premium dark", status: "PASS", detail: "Diseño coherente, spacing consistente y acento #d4e83a con copy claro en español." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 11</h1>
        <p className="text-sm text-zinc-400">Checklist operativo para validar aceptación PRD antes de deploy.</p>
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
            Ir a <Link href="/inbox" className="text-[#d4e83a] underline">/inbox</Link> y validar tabs por canal + filtros + cards enriquecidas.
          </li>
          <li>
            Validar en thread de <code>/inbox</code> que cada mensaje muestra canal fuente y badge de tipo.
          </li>
          <li>
            GET <code>/api/channels/health</code> debe responder <code>{`{ ok: true, data: { adapters } }`}</code>.
          </li>
          <li>
            POST <code>/api/channels/send</code> con payload válido debe encolar envío mock; payload inválido devuelve <code>{`{ ok: false, error }`}</code>.
          </li>
          <li>
            POST <code>/api/channels/inbound</code> debe devolver envelope normalizado por canal.
          </li>
          <li>
            Ir a <Link href="/ops" className="text-[#d4e83a] underline">/ops</Link> y ejecutar acciones Pausar/Reanudar/Reintentar fallidos (mock).
          </li>
        </ol>
      </section>
    </main>
  );
}
