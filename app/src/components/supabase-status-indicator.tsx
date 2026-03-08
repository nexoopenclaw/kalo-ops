"use client";

import { useEffect, useState } from "react";

type PingState = "idle" | "loading" | "ok" | "error";

export function SupabaseStatusIndicator() {
  const [state, setState] = useState<PingState>("idle");

  useEffect(() => {
    let mounted = true;

    async function runPing() {
      setState("loading");
      try {
        const response = await fetch("/api/supabase/ping", { method: "GET" });
        if (!mounted) return;
        setState(response.ok ? "ok" : "error");
      } catch {
        if (!mounted) return;
        setState("error");
      }
    }

    void runPing();

    return () => {
      mounted = false;
    };
  }, []);

  const label =
    state === "loading"
      ? "Checking Supabase..."
      : state === "ok"
        ? "Supabase: connected"
        : state === "error"
          ? "Supabase: error"
          : "Supabase: idle";

  const dotClass =
    state === "ok" ? "bg-emerald-500" : state === "error" ? "bg-red-500" : state === "loading" ? "bg-yellow-500" : "bg-zinc-500";

  return (
    <div className="mt-4 inline-flex items-center gap-2 rounded border border-zinc-800 px-3 py-1 text-xs text-zinc-300">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden />
      <span>{label}</span>
    </div>
  );
}
