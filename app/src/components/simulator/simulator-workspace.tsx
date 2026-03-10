"use client";

import { useState } from "react";

type SimulatorResult = {
  requestId: string;
  calendly: { status: string; message: string };
  stripe: { status: string; message: string };
  deal: { id: string; stage: string; leadName: string; leadEmail: string; stageHistory: Array<{ fromStage: string; toStage: string; changedAt: string }> };
  bridgeSnapshot: {
    lastCalendlyEvents: Array<{ id: string; status: string; message: string }>;
    lastStripeEvents: Array<{ id: string; status: string; message: string }>;
  };
};

export function SimulatorWorkspace() {
  const [dealId, setDealId] = useState("deal_1");
  const [email, setEmail] = useState("martina@atenea.io");
  const [amount, setAmount] = useState("4800");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SimulatorResult | null>(null);

  const run = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/simulator/revenue-loop/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, inviteeEmail: email, customerEmail: email, amount: Number(amount) }),
      });
      const json = (await response.json()) as { ok: boolean; data?: SimulatorResult };
      setResult(json.data ?? null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">Simulator · Revenue Loop</h1>
        <p className="text-sm text-zinc-400">Simula booking de Calendly + pago de Stripe y valida transición del deal en cadena.</p>
      </section>

      <section className="card p-4 grid gap-2 md:grid-cols-4">
        <input value={dealId} onChange={(e) => setDealId(e.target.value)} placeholder="deal_id" className="rounded-lg border border-white/15 bg-[#0f1724] px-2 py-2 text-sm" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email lead" className="rounded-lg border border-white/15 bg-[#0f1724] px-2 py-2 text-sm" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="monto" className="rounded-lg border border-white/15 bg-[#0f1724] px-2 py-2 text-sm" />
        <button onClick={run} disabled={busy} className="rounded-lg border border-[#d4e83a]/35 bg-[#d4e83a]/10 px-3 py-2 text-sm font-medium text-[#d4e83a] disabled:opacity-50">
          {busy ? "Ejecutando..." : "Ejecutar simulación"}
        </button>
      </section>

      {result ? (
        <section className="grid gap-3 lg:grid-cols-2">
          <article className="card p-4 text-sm">
            <p className="font-semibold">Resultado</p>
            <p className="text-zinc-400">Request ID: {result.requestId}</p>
            <p className="mt-2">Calendly: <span className="text-[#d4e83a]">{result.calendly.status}</span> · {result.calendly.message}</p>
            <p>Stripe: <span className="text-[#d4e83a]">{result.stripe.status}</span> · {result.stripe.message}</p>
            <p className="mt-2">Deal {result.deal.id} · etapa actual <span className="text-[#d4e83a]">{result.deal.stage}</span></p>
          </article>

          <article className="card p-4 text-sm">
            <p className="font-semibold">Historial de etapas (últimos)</p>
            <div className="mt-2 space-y-1">
              {result.deal.stageHistory.map((item, idx) => (
                <p key={idx} className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1">
                  {item.fromStage} → {item.toStage} · {new Date(item.changedAt).toLocaleString("es-ES")}
                </p>
              ))}
            </div>
          </article>

          <article className="card p-4 text-sm">
            <p className="font-semibold">Bridge logs · Calendly</p>
            <pre className="mt-2 max-h-52 overflow-auto rounded-lg border border-white/10 bg-[#0d131f] p-2 text-xs">{JSON.stringify(result.bridgeSnapshot.lastCalendlyEvents, null, 2)}</pre>
          </article>

          <article className="card p-4 text-sm">
            <p className="font-semibold">Bridge logs · Stripe</p>
            <pre className="mt-2 max-h-52 overflow-auto rounded-lg border border-white/10 bg-[#0d131f] p-2 text-xs">{JSON.stringify(result.bridgeSnapshot.lastStripeEvents, null, 2)}</pre>
          </article>
        </section>
      ) : null}
    </main>
  );
}
