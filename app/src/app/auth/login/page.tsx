"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setStatus(`Error: ${error.message}`);
        return;
      }
      setStatus("Login correcto ✅");
      router.push("/hoy");
      router.refresh();
    } catch (err) {
      setStatus(`Error inesperado: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="card w-full max-w-md p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Kalo Ops</p>
        <h1 className="mt-2 text-2xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-zinc-400">Inicia sesión con tu cuenta de Supabase.</p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <input
            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#d4e83a] px-3 py-2 text-sm font-semibold text-black disabled:opacity-60">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {status ? <p className="mt-3 text-xs text-zinc-300">{status}</p> : null}

        <p className="mt-4 text-sm text-zinc-400">
          ¿No tienes cuenta? <Link href="/auth/register" className="text-[#d4e83a]">Crear cuenta</Link>
        </p>
      </section>
    </main>
  );
}
