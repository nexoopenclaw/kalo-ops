import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="card w-full max-w-md p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Kalo Ops</p>
        <h1 className="mt-2 text-2xl font-semibold">Register</h1>
        <p className="mt-1 text-sm text-zinc-400">UI skeleton (sin creación de usuario real todavía).</p>

        <form className="mt-5 space-y-3">
          <input className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm" type="text" placeholder="Nombre" />
          <input className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm" type="email" placeholder="Email" />
          <input className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm" type="password" placeholder="Password" />
          <button type="button" className="w-full rounded-lg bg-[#d4e83a] px-3 py-2 text-sm font-semibold text-black">
            Crear cuenta
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-400">
          ¿Ya tienes cuenta? <Link href="/auth/login" className="text-[#d4e83a]">Iniciar sesión</Link>
        </p>
      </section>
    </main>
  );
}
