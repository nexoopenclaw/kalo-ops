import Link from "next/link";

const checks = [
  { module: "Experimentos A/B", status: "PASS", detail: "Wizard, assignment determinístico, outcomes, estados y dashboard activos." },
  { module: "Voice Notes", status: "PASS", detail: "Auditoría de preview/send + guardrail de consentimiento explícito + revocación." },
  { module: "API & persistencia", status: "PASS", detail: "Repositorio compartido in-memory + schema consistente ok/error." },
  { module: "UX premium dark", status: "PASS", detail: "Paleta oscura consistente con #d4e83a y copy en español." },
];

export default function QAPage() {
  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">QA interno · Sprint 8</h1>
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
          <li>Ir a <Link href="/voice-lab" className="text-[#d4e83a] underline">/voice-lab</Link>, dar consentimiento, generar preview y enviar nota (debe loguear preview_generated + voice_sent).</li>
          <li>Desmarcar consentimiento o revocar y reintentar envío (debe devolver error CONSENT_REQUIRED).</li>
          <li>Crear experimento, pasar a running, ejecutar “Asignar variante” 2 veces con mismo leadKey (debe devolver misma variante).</li>
          <li>Registrar outcomes mock y abrir dashboard con ventana 7 días (ver lift, confianza, winner state).</li>
          <li>Pausar/completar experimento y probar registrar outcome (debe bloquear por estado).</li>
        </ol>
      </section>
    </main>
  );
}
