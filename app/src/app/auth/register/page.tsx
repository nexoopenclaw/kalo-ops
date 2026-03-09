"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() || null },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/login` : undefined,
        },
      });
      if (error) {
        setStatus(`Error: ${error.message}`);
        return;
      }
      setStatus("Cuenta creada ✅ Revisa tu email para confirmar (si aplica) y luego inicia sesión.");
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
        <h1 className="mt-2 text-2xl font-semibold">Register</h1>
        <p className="mt-1 text-sm text-zinc-400">Crea tu usuario real en Supabase Auth.</p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <input
            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
            placeholder="Password (mínimo 6)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#d4e83a] px-3 py-2 text-sm font-semibold text-black disabled:opacity-60">
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        {status ? <p className="mt-3 text-xs text-zinc-300">{status}</p> : null}

        <p className="mt-4 text-sm text-zinc-400">
          ¿Ya tienes cuenta? <Link href="/auth/login" className="text-[#d4e83a]">Iniciar sesión</Link>
        </p>
      </section>
    </main>
  );
}
