"use client";

import { useMemo, useState } from "react";
import type { Deal, DealStage, FunnelSummary, ListDealsFilters } from "@/lib/crm-service";
import { crmStageLabels } from "@/lib/crm-service";

type CrmWorkspaceProps = {
  initialDeals: Deal[];
  initialSummary: FunnelSummary;
};

const stageOrder: DealStage[] = ["new", "qualified", "booked", "show", "won", "lost"];

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function daysAgo(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

export function CrmWorkspace({ initialDeals, initialSummary }: CrmWorkspaceProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [summary, setSummary] = useState(initialSummary);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [objectionsDraft, setObjectionsDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filters, setFilters] = useState<ListDealsFilters>({});

  const ownerOptions = useMemo(
    () =>
      Array.from(new Set(initialDeals.map((deal) => `${deal.ownerId}::${deal.ownerName}`))).map((item) => {
        const [ownerId, ownerName] = item.split("::");
        return { ownerId, ownerName };
      }),
    [initialDeals],
  );

  const selectedDeal = useMemo(() => deals.find((deal) => deal.id === selectedDealId) ?? null, [deals, selectedDealId]);

  const byStage = useMemo(() => {
    return stageOrder.reduce<Record<DealStage, Deal[]>>((acc, stage) => {
      acc[stage] = deals.filter((deal) => deal.stage === stage);
      return acc;
    }, {} as Record<DealStage, Deal[]>);
  }, [deals]);

  const refreshAnalytics = async () => {
    const response = await fetch("/api/analytics/funnel-summary?organizationId=org_1&atRiskDays=5", { method: "GET" });
    if (!response.ok) return;
    const payload = (await response.json()) as { ok: boolean; data?: FunnelSummary };
    if (payload.ok && payload.data) setSummary(payload.data);
  };

  const updateStage = async (dealId: string, nextStage: DealStage) => {
    const response = await fetch("/api/deals/update-stage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: "org_1", dealId, nextStage }),
    });

    if (!response.ok) return;

    const data = (await response.json()) as { ok: boolean; data?: Deal };
    if (!data.ok || !data.data) return;

    setDeals((prev) => prev.map((item) => (item.id === data.data?.id ? data.data : item)));
    await refreshAnalytics();
  };

  const applyFilters = async (nextFilters: ListDealsFilters) => {
    setLoadingFilters(true);
    setFilters(nextFilters);

    const params = new URLSearchParams({ organizationId: "org_1" });
    if (nextFilters.ownerId) params.set("ownerId", nextFilters.ownerId);
    if (nextFilters.stage) params.set("stage", nextFilters.stage);
    if (nextFilters.query) params.set("query", nextFilters.query);
    if (nextFilters.fromDate) params.set("fromDate", nextFilters.fromDate);
    if (nextFilters.toDate) params.set("toDate", nextFilters.toDate);

    const response = await fetch(`/api/analytics/funnel-summary?${params.toString()}`);
    const payload = (await response.json()) as { ok: boolean; data?: FunnelSummary; deals?: Deal[] };

    if (response.ok && payload.ok && payload.data && payload.deals) {
      setSummary(payload.data);
      setDeals(payload.deals);
    }

    setLoadingFilters(false);
  };

  const openDrawer = (deal: Deal) => {
    setSelectedDealId(deal.id);
    setNoteDraft("");
    setObjectionsDraft(deal.objections.join("\n"));
  };

  const saveNoteAndObjections = async () => {
    if (!selectedDeal || !noteDraft.trim()) return;

    setSaving(true);
    const response = await fetch("/api/deals/upsert-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: "org_1",
        dealId: selectedDeal.id,
        note: noteDraft,
        objections: objectionsDraft
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });

    const payload = (await response.json()) as { ok: boolean; data?: Deal };
    if (response.ok && payload.ok && payload.data) {
      setDeals((prev) => prev.map((item) => (item.id === payload.data?.id ? payload.data : item)));
      setNoteDraft("");
      await refreshAnalytics();
    }
    setSaving(false);
  };

  return (
    <main className="space-y-4">
      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">CRM Pipeline + Revenue Analytics</h1>
            <p className="text-sm text-zinc-400">Filtros, riesgo, velocity y métricas de conversión para operación diaria.</p>
          </div>
          <span className="rounded-lg border border-[#d4e83a]/40 bg-[#d4e83a]/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#d4e83a]">
            Sprint 5 Analytics
          </span>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        {[
          { label: "Booking rate", value: `${summary.bookingRate}%` },
          { label: "Show-up rate", value: `${summary.showUpRate}%` },
          { label: "Closing rate", value: `${summary.closingRate}%` },
          { label: "Funnel velocity", value: `${summary.funnelVelocityDays} días` },
          { label: "Revenue en juego", value: formatMoney(summary.revenueInPlayTotal, "EUR") },
        ].map((metric) => (
          <article key={metric.label} className="card p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#d4e83a]">{metric.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <article className="card p-4">
          <h3 className="text-sm font-semibold">Top objeciones</h3>
          <div className="mt-3 space-y-2">
            {summary.topObjections.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
                <p className="text-zinc-300">{item.label}</p>
                <span className="rounded-md border border-[#d4e83a]/35 bg-[#d4e83a]/10 px-2 py-0.5 text-xs text-[#d4e83a]">{item.count}</span>
              </div>
            ))}
            {summary.topObjections.length === 0 && <p className="text-sm text-zinc-500">Sin objeciones registradas.</p>}
          </div>
        </article>

        <article className="card p-4">
          <h3 className="text-sm font-semibold">Deals en riesgo (&gt; 5 días sin actividad)</h3>
          <div className="mt-3 space-y-2">
            {summary.dealsAtRisk.map((risk) => (
              <div key={risk.dealId} className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2">
                <p className="text-sm font-semibold text-zinc-100">{risk.leadName}</p>
                <p className="text-xs text-zinc-300">
                  {risk.ownerName} · {crmStageLabels[risk.stage]} · {risk.inactiveDays} días
                </p>
              </div>
            ))}
            {summary.dealsAtRisk.length === 0 && <p className="text-sm text-zinc-500">Sin riesgo detectado.</p>}
          </div>
        </article>

        <article className="card p-4">
          <h3 className="text-sm font-semibold">Revenue por etapa</h3>
          <div className="mt-3 space-y-2">
            {summary.revenueByStage.map((item) => (
              <div key={item.stage} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
                <p className="text-zinc-300">
                  {item.label} <span className="text-zinc-500">({item.deals})</span>
                </p>
                <span className="text-[#d4e83a]">{formatMoney(item.totalValue, "EUR")}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card p-3">
        <div className="grid gap-2 md:grid-cols-5">
          <input
            value={filters.query ?? ""}
            onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
            placeholder="Buscar lead/email/owner..."
            className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm outline-none focus:border-[#d4e83a]/45"
          />
          <select
            value={filters.ownerId ?? ""}
            onChange={(event) => setFilters((prev) => ({ ...prev, ownerId: event.target.value || undefined }))}
            className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm"
          >
            <option value="">Todos los owners</option>
            {ownerOptions.map((owner) => (
              <option key={owner.ownerId} value={owner.ownerId}>
                {owner.ownerName}
              </option>
            ))}
          </select>
          <select
            value={filters.stage ?? ""}
            onChange={(event) => setFilters((prev) => ({ ...prev, stage: (event.target.value as DealStage) || undefined }))}
            className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm"
          >
            <option value="">Todas las etapas</option>
            {stageOrder.map((stage) => (
              <option key={stage} value={stage}>
                {crmStageLabels[stage]}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.fromDate ?? ""}
            onChange={(event) => setFilters((prev) => ({ ...prev, fromDate: event.target.value || undefined }))}
            className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.toDate ?? ""}
              onChange={(event) => setFilters((prev) => ({ ...prev, toDate: event.target.value || undefined }))}
              className="w-full rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm"
            />
            <button
              onClick={() => applyFilters(filters)}
              className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-4 text-sm font-medium text-[#d4e83a]"
            >
              {loadingFilters ? "..." : "Filtrar"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 overflow-x-auto pb-2 xl:grid-cols-6">
        {stageOrder.map((stage) => (
          <div key={stage} className="card min-h-[420px] min-w-[250px] p-3">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200">{crmStageLabels[stage]}</h2>
              <span className="rounded-md border border-white/15 px-2 py-0.5 text-xs text-zinc-400">{byStage[stage]?.length ?? 0}</span>
            </header>

            <div className="space-y-2">
              {byStage[stage]?.map((deal) => (
                <article
                  key={deal.id}
                  onClick={() => openDrawer(deal)}
                  className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-[#d4e83a]/35 hover:bg-[#d4e83a]/8"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{deal.leadProfile.fullName}</p>
                    <span className="text-xs text-[#d4e83a]">{formatMoney(deal.value, deal.currency)}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">Owner: {deal.ownerName}</p>
                  <p className="mt-2 text-xs text-zinc-300">Next: {deal.nextStep}</p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[11px] ${
                        daysAgo(deal.lastActivityAt) > 5
                          ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
                          : "border-emerald-400/45 bg-emerald-500/10 text-emerald-200"
                      }`}
                    >
                      {daysAgo(deal.lastActivityAt) > 5 ? `Riesgo ${daysAgo(deal.lastActivityAt)}d` : "Activo"}
                    </span>

                    <select
                      value={deal.stage}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => updateStage(deal.id, event.target.value as DealStage)}
                      className="rounded-md border border-white/15 bg-[#101827] px-2 py-1 text-[11px] text-zinc-200"
                    >
                      {stageOrder.map((option) => (
                        <option key={option} value={option}>
                          {crmStageLabels[option]}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      {selectedDeal && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/55" onClick={() => setSelectedDealId(null)}>
          <aside
            className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#0b1320] p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Lead profile</p>
                <h3 className="text-xl font-semibold">{selectedDeal.leadProfile.fullName}</h3>
              </div>
              <button className="rounded-lg border border-white/15 px-2 py-1 text-sm text-zinc-300" onClick={() => setSelectedDealId(null)}>
                Cerrar
              </button>
            </div>

            <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <p>
                <span className="text-zinc-500">Owner:</span> {selectedDeal.ownerName}
              </p>
              <p>
                <span className="text-zinc-500">Email:</span> {selectedDeal.leadProfile.email}
              </p>
              <p>
                <span className="text-zinc-500">Tel:</span> {selectedDeal.leadProfile.phone}
              </p>
              <p className="text-zinc-400">{selectedDeal.leadProfile.summary}</p>
            </div>

            <div className="mt-5">
              <h4 className="text-sm font-semibold">Timeline de movimiento de etapas</h4>
              <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                {selectedDeal.stageHistory.map((event) => (
                  <div key={event.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-2 text-sm">
                    <p className="text-zinc-200">
                      {crmStageLabels[event.fromStage]} → <span className="text-[#d4e83a]">{crmStageLabels[event.toStage]}</span>
                    </p>
                    <p className="text-xs text-zinc-500">{new Date(event.changedAt).toLocaleString("es-ES")}</p>
                    {event.reason && <p className="text-xs text-zinc-400">Motivo: {event.reason}</p>}
                  </div>
                ))}
                {selectedDeal.stageHistory.length === 0 && <p className="text-sm text-zinc-500">Sin movimientos registrados.</p>}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <h4 className="text-sm font-semibold">Notas</h4>
              <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-4">
                {selectedDeal.notes.map((note, index) => (
                  <p key={`${selectedDeal.id}-note-${index}`} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-zinc-300">
                    {note}
                  </p>
                ))}
                <textarea
                  rows={3}
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Añadir nota operativa..."
                  className="w-full resize-none rounded-lg border border-white/15 bg-[#0d1420] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#d4e83a]/45"
                />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <h4 className="text-sm font-semibold">Objeciones</h4>
              <textarea
                rows={5}
                value={objectionsDraft}
                onChange={(event) => setObjectionsDraft(event.target.value)}
                placeholder="Una objeción por línea..."
                className="w-full resize-none rounded-xl border border-white/15 bg-[#0d1420] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#d4e83a]/45"
              />
              <button
                onClick={saveNoteAndObjections}
                disabled={saving}
                className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-4 py-2 text-sm font-medium text-[#d4e83a] disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar nota + objeciones"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
