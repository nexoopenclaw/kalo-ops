"use client";

import { useMemo, useState } from "react";
import type { ExperimentResults, VoiceAuditLog, VoicePreviewResult } from "@/lib/voice-service";

type Props = {
  actorUserId: string;
  organizationId: string;
  leadId: string;
  voiceModelId: string;
};

export function VoiceLabWorkspace({ actorUserId, organizationId, leadId, voiceModelId }: Props) {
  const [consentGranted, setConsentGranted] = useState(false);
  const [sourceText, setSourceText] = useState("Hey Martina, te mando este audio con el plan de 3 pasos para cerrar en 7 días.");
  const [preview, setPreview] = useState<VoicePreviewResult | null>(null);
  const [auditLogs, setAuditLogs] = useState<VoiceAuditLog[]>([]);
  const [loading, setLoading] = useState<null | "preview" | "send" | "experiment" | "record" | "results">(null);

  const [experimentId, setExperimentId] = useState("");
  const [trafficSplitA, setTrafficSplitA] = useState(50);
  const [variantAOpener, setVariantAOpener] = useState("Hola {{name}}, acabo de revisar tu caso y veo una oportunidad rápida.");
  const [variantAFollowup, setVariantAFollowup] = useState("Si te encaja, hoy te paso roadmap exacto y arrancamos.");
  const [variantBOpener, setVariantBOpener] = useState("{{name}}, te dejo una idea breve para subir replies esta semana.");
  const [variantBFollowup, setVariantBFollowup] = useState("¿Te va que validemos fit en 15 min mañana?");
  const [results, setResults] = useState<ExperimentResults | null>(null);

  const winnerBadge = useMemo(() => {
    if (!results) return "Sin ganador";
    if (results.winner.variant === "none") return "No concluyente";
    return `Winner ${results.winner.variant}`;
  }, [results]);

  const saveConsent = async (nextValue: boolean) => {
    setConsentGranted(nextValue);
    await fetch("/api/voice/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, actorUserId, leadId, voiceCloneAllowed: nextValue }),
    });
  };

  const generatePreview = async () => {
    setLoading("preview");
    const response = await fetch("/api/voice/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, actorUserId, voiceModelId, sourceText }),
    });
    const payload = (await response.json()) as { ok: boolean; data?: VoicePreviewResult };
    if (payload.ok && payload.data) setPreview(payload.data);
    setLoading(null);
  };

  const sendVoice = async () => {
    setLoading("send");
    const response = await fetch("/api/voice/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, actorUserId, leadId, voiceModelId, sourceText, previewId: preview?.previewId }),
    });
    const payload = (await response.json()) as { ok: boolean; data?: VoiceAuditLog };
    if (payload.ok && payload.data) setAuditLogs((prev) => [payload.data as VoiceAuditLog, ...prev]);
    setLoading(null);
  };

  const createExperiment = async () => {
    setLoading("experiment");
    const response = await fetch("/api/experiments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        actorUserId,
        name: "Sprint 8 Voice Follow-up",
        trafficSplitA,
        variantA: { openerTemplate: variantAOpener, followupTemplate: variantAFollowup },
        variantB: { openerTemplate: variantBOpener, followupTemplate: variantBFollowup },
      }),
    });

    const payload = (await response.json()) as { ok: boolean; data?: { id: string } };
    if (payload.ok && payload.data?.id) setExperimentId(payload.data.id);
    setLoading(null);
  };

  const seedStats = async () => {
    if (!experimentId) return;
    setLoading("record");

    const programmatic = [
      { variant: "A", impression: 60, reply: 22, conversion: 8 },
      { variant: "B", impression: 54, reply: 15, conversion: 5 },
    ] as const;

    for (const batch of programmatic) {
      await fetch("/api/experiments/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, experimentId, variant: batch.variant, eventType: "impression", weight: batch.impression }),
      });
      await fetch("/api/experiments/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, experimentId, variant: batch.variant, eventType: "reply", weight: batch.reply }),
      });
      await fetch("/api/experiments/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, experimentId, variant: batch.variant, eventType: "conversion", weight: batch.conversion }),
      });
    }

    setLoading(null);
  };

  const loadResults = async () => {
    if (!experimentId) return;
    setLoading("results");
    const response = await fetch(`/api/experiments/${experimentId}/results?organizationId=${organizationId}`);
    const payload = (await response.json()) as { ok: boolean; data?: ExperimentResults };
    if (payload.ok && payload.data) setResults(payload.data);
    setLoading(null);
  };

  return (
    <main className="space-y-4">
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Voice Notes + A/B Lab</h1>
            <p className="text-sm text-zinc-400">Sprint 8 scaffold · credential-free con hooks para producción.</p>
          </div>
          <span className="rounded-lg border border-[#d4e83a]/40 bg-[#d4e83a]/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#d4e83a]">
            Sprint 8
          </span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="card p-4">
          <h3 className="text-lg font-semibold">Voice Notes</h3>
          <label className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
            <span>Consent gate para voice clone</span>
            <input type="checkbox" checked={consentGranted} onChange={(e) => void saveConsent(e.target.checked)} className="h-4 w-4 accent-[#d4e83a]" />
          </label>

          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={4}
            className="mt-3 w-full rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm"
          />

          <div className="mt-3 flex gap-2">
            <button
              onClick={generatePreview}
              disabled={!consentGranted || loading === "preview"}
              className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-3 py-1.5 text-sm text-[#d4e83a] disabled:opacity-40"
            >
              {loading === "preview" ? "Generando..." : "Generar preview"}
            </button>
            <button
              onClick={sendVoice}
              disabled={!preview || loading === "send"}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 disabled:opacity-40"
            >
              {loading === "send" ? "Enviando..." : "Send voice note"}
            </button>
          </div>

          {preview && (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-zinc-300">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Preview script</p>
              <p className="mt-1">{preview.script}</p>
              <p className="mt-2 text-xs text-zinc-500">Hash {preview.sourceTextHash.slice(0, 12)}... · model {preview.modelId} · {preview.state}</p>
            </div>
          )}
        </article>

        <article className="card p-4">
          <h3 className="text-lg font-semibold">Audit log</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="text-zinc-500">
                <tr>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Source hash</th>
                  <th className="pb-2">Voice model</th>
                  <th className="pb-2">Actor</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t border-white/10">
                    <td className="py-2">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-2">{log.sourceTextHash.slice(0, 10)}...</td>
                    <td className="py-2">{log.voiceModelId}</td>
                    <td className="py-2">{log.actorUserId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!auditLogs.length && <p className="mt-3 text-sm text-zinc-500">Sin eventos aún.</p>}
          </div>
        </article>
      </section>

      <section className="card p-4">
        <h3 className="text-lg font-semibold">A/B Testing Templates</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-[#d4e83a]">Variant A</p>
            <textarea value={variantAOpener} onChange={(e) => setVariantAOpener(e.target.value)} rows={2} className="w-full rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" />
            <textarea value={variantAFollowup} onChange={(e) => setVariantAFollowup(e.target.value)} rows={2} className="w-full rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-[#d4e83a]">Variant B</p>
            <textarea value={variantBOpener} onChange={(e) => setVariantBOpener(e.target.value)} rows={2} className="w-full rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" />
            <textarea value={variantBFollowup} onChange={(e) => setVariantBFollowup(e.target.value)} rows={2} className="w-full rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm text-zinc-400">Traffic A %</label>
          <input
            type="range"
            min={5}
            max={95}
            value={trafficSplitA}
            onChange={(e) => setTrafficSplitA(Number(e.target.value))}
            className="accent-[#d4e83a]"
          />
          <span className="text-sm text-[#d4e83a]">{trafficSplitA}% / {100 - trafficSplitA}%</span>
          <button onClick={createExperiment} className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-3 py-1.5 text-sm text-[#d4e83a]">
            {loading === "experiment" ? "Creando..." : "Crear experimento"}
          </button>
          <button onClick={seedStats} disabled={!experimentId} className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 disabled:opacity-40">
            {loading === "record" ? "Registrando..." : "Asignar tráfico mock"}
          </button>
          <button onClick={loadResults} disabled={!experimentId} className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 disabled:opacity-40">
            {loading === "results" ? "Calculando..." : "Ver stats"}
          </button>
        </div>

        {results && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(["A", "B"] as const).map((variant) => (
              <div key={variant} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                <p className="font-semibold">Variant {variant}</p>
                <p className="text-zinc-400">Reply rate: {(results.stats[variant].replyRate * 100).toFixed(1)}%</p>
                <p className="text-zinc-400">Conversion proxy: {(results.stats[variant].conversionProxy * 100).toFixed(1)}%</p>
                <p className="text-zinc-500">Impressions: {results.stats[variant].impressions}</p>
              </div>
            ))}
            <div className="rounded-xl border border-[#d4e83a]/35 bg-[#d4e83a]/10 p-3 text-sm text-[#d4e83a]">
              <p className="font-semibold">{winnerBadge}</p>
              <p>Confidence {(results.winner.confidence * 100).toFixed(0)}%</p>
              <p className="text-zinc-300">{results.winner.reason}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
