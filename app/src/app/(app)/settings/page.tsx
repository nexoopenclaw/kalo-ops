import Link from "next/link";

const blocks = [
  {
    title: "Organización",
    detail: "Nombre, zona horaria, branding y defaults operativos.",
  },
  {
    title: "Usuarios y roles",
    detail: "Owners, setters, closers y permisos RBAC por módulo.",
  },
  {
    title: "Integraciones",
    detail: "Estado mock/live, credenciales y health por proveedor.",
  },
  {
    title: "Automations",
    detail: "Flags de ejecución, límites, dry-run global e idempotencia.",
  },
];

export default function SettingsPage() {
  return (
    <main className="space-y-4">
      <section className="card p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Sprint 24 · Settings</p>
        <h1 className="mt-2 text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-zinc-300">
          Centro de configuración del workspace. Queda operativo como hub y conectado al módulo de <span className="text-[#d4e83a]">Config</span>.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {blocks.map((block) => (
            <article key={block.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-sm font-semibold text-white">{block.title}</h2>
              <p className="mt-1 text-sm text-zinc-400">{block.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/config" className="rounded-lg bg-[#d4e83a] px-3 py-2 text-sm font-semibold text-black">
            Abrir Config detallado
          </Link>
          <Link href="/integraciones" className="rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5">
            Revisar Integraciones
          </Link>
          <Link href="/ops" className="rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5">
            Ver Ops y Flags
          </Link>
        </div>
      </section>
    </main>
  );
}
