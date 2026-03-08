"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inbox", label: "Inbox" },
  { href: "/crm", label: "CRM" },
  { href: "/automations", label: "Automations" },
  { href: "/copilot", label: "Copilot" },
  { href: "/voice-lab", label: "Voice Lab" },
  { href: "/attribution", label: "Attribution" },
  { href: "/reportes", label: "Reportes" },
  { href: "/config", label: "Config" },
  { href: "/qa", label: "QA" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="mx-auto flex max-w-7xl gap-4 px-4 py-5 md:px-6">
        <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-64 shrink-0 flex-col rounded-2xl border border-white/10 bg-[#0c1320]/95 p-4 md:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Kalo Ops</p>
            <h1 className="mt-2 text-xl font-semibold">Control Center</h1>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-[#d4e83a]/15 text-[#d4e83a]"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-[#d4e83a]/25 bg-[#d4e83a]/10 p-3 text-xs text-zinc-200">
            Sprint 10 Foundation • Attribution + Reporting
          </div>
        </aside>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
