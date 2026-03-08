import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <header className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0e1420]/90 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Workspace</p>
          <h2 className="text-lg font-semibold text-white">Kalo Ops · Sprint 11</h2>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Link href="/auth/login" className="rounded-lg border border-white/15 px-3 py-1.5 text-zinc-300 hover:bg-white/5">
            Login
          </Link>
          <Link href="/auth/register" className="rounded-lg border border-[#d4e83a]/40 bg-[#d4e83a]/15 px-3 py-1.5 text-[#d4e83a]">
            Register
          </Link>
        </div>
      </header>
      {children}
    </AppShell>
  );
}
