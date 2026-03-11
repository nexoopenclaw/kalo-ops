"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExperimentRecord, ExperimentResults, VoiceAuditLog, VoiceComplianceStatus, VoicePreviewResult } from "@/lib/voice-service";

type Props = {
  actorUserId: string;
  organizationId: string;
  leadId: string;
  voiceModelId: string;
};

export function VoiceLabWorkspace({ actorUserId, organizationId, leadId, voiceModelId }: Props) {
  const [consentGranted, setConsentGranted] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [compliance, setCompliance] = useState<VoiceComplianceStatus | null>(null);
  const [sourceText, setSourceText] = useState("Hey Martina, te mando este audio con el plan de 3 pasos para cerrar en 7 días.");
  const [preview, setPreview] = useState<VoicePreviewResult | null>(null);
  const [auditLogs, setAuditLogs] = useState<VoiceAuditLog[]>([]);
  const [uiError, setUiError] = useState<string | null>(null);
  const [loading, setLoading] = useState<null | "preview" | "send" | "experiment" | "record" | "results" | "state" | "assignment">(null);

  const [goal, setGoal] = useState("Incrementar conversiones a llamada agendada");
  const [channel, setChannel] = useState<"instagram" | "whatsapp" | "email" | "webchat">("instagram");
  const [experimentId, setExperimentId] = useState("");
  const [experiment, setExperiment] = useState<ExperimentRecord | null>(null);
  const [trafficSplitA, setTrafficSplitA] = useState(50);
  const [variantAOpener, setVariantAOpener] = useState("Hola {{name}}, revisé tu caso y hay una oportunidad rápida para cerrar esta semana.");
  const [variantAFollowup, setVariantAFollowup] = useState("Si te encaja, te comparto roadmap exacto y arrancamos hoy.");
  const [variantBOpener, setVariantBOpener] = useState("{{name}}, te dejo una idea concreta para aumentar replies en 72h.");
  const [variantBFollowup, setVariantBFollowup] = useState("¿Te va validarlo en 15 min mañana?");
  const [simulationLead, setSimulationLead] = useState("lead-sim-001");
  const [assignmentResult, setAssignmentResult] = useState<{ variant: "A" | "B"; bucket: number; state: string } | null>(null);
  const [results, setResults] = useState<ExperimentResults | null>(null);
  const [windowDays, setWindowDays] = useState(7);

  const winnerBadge = useMemo(() => {
    if (!results) return "Sin resultados";
    if (results.winner.variant === "none") return "Sin ganador";
    return `Ganadora variante ${results.winner.variant}`;
  }, [results]);

  const refreshCompliance = async () => {
    const response = await fetch(`/api/voice/compliance?organizationId=${organizationId}&leadId=${leadId}`);
    const payload = (await response.json()) as { ok: boolean; data?: VoiceComplianceStatus };
    if (payload.ok && payload.data) {
      setCompliance(payload.data);
      setConsentGranted(payload.data.consentStatus === "granted");
    }
  };

  const refreshAudit = async () => {
    const response = await fetch(`/api/voice/audit?organizationId=${organizationId}&leadId=${leadId}`);
    const payload = (await response.json()) as { ok: boolean; data?: VoiceAuditLog[] };
    if (payload.ok && payload.data) setAuditLogs(payload.data);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void refreshCompliance();
      void refreshAudit();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const saveConsent = async (nextValue: boolean) => {
    setUiError(null);
    const endpoint = nextValue ? "/api/voice/consent" : "/api/voice/consent/revoke";
    const body = nextValue
      ? { organizationId, actorUserId, leadId, voiceCloneAllowed: true, reason: "Consentimiento explícito en Voice Lab" }
      : { organizationId, actorUserId, leadId, reason: "Revocación manual desde panel de compliance" };

    await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setConsentConfirmed(false);
    await refreshCompliance();
  };

  const generatePreview = async () => {
    setLoading("preview");
    setUiError(null);
    const response = await fetch("/api/voice/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, actorUserId, leadId, voiceModelId, sourceText }),
    });
    const payload = (await response.json()) as { ok: boolean; data?: VoicePreviewResult; error?: { message: string } };
    if (payload.ok && payload.data) {
      setPreview(payload.data);
      await refreshAudit();
    } else {
      setUiError(payload.error?.message ?? "No pudimos generar el preview.");
    }
    setLoading(null);
  };

  const sendVoice = async () => {
    setLoading("send");
    setUiError(null);
    const response = await fetch("/api/voice/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, actorUserId, leadId, voiceModelId, sourceText, previewId: preview?.previewId, consentConfirmed }),
    });
    const payload = (await response.json()) as { ok: boolean; error?: { message: string } };
    if (!payload.ok) setUiError(payload.error?.message ?? "No se pudo enviar la nota de voz.");
    await refreshAudit();
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
        goal,
        channel,
        trafficSplitA,
        variantA: { name: "A - Directa", openerTemplate: variantAOpener, followupTemplate: variantAFollowup },
        variantB: { name: "B - Consultiva", openerTemplate: variantBOpener, followupTemplate: variantBFollowup },
      }),
    });

    const payload = (await response.json()) as { ok: boolean; data?: ExperimentRecord; error?: { message: string } };
    if (payload.ok && payload.data) {
      setExperiment(payload.data);
      setExperimentId(payload.data.id);
    } else {
      setUiError(payload.error?.message ?? "No se pudo crear experimento.");
    }
    setLoading(null);
  };

  const transitionState = async (nextState: "draft" | "running" | "paused" | "completed") => {
    if (!experimentId) return;
    setLoading("state");
    const response = await fetch(`/api/experiments/${experimentId}/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, nextState }),
    });
    const payload = (await response.json()) as { ok: boolean; data?: ExperimentRecord };
    if (payload.ok && payload.data) setExperiment(payload.data);
    setLoading(null);
  };

  const simulateAssignment = async () => {
    if (!experimentId) return;
    setLoading("assignment");
    const response = await fetch("/api/experiments/assignment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, experimentId, leadKey: simulationLead }),
    });
    const payload = (await response.json()) as { ok: boolean; data?: { variant: "A" | "B"; bucket: number; state: string } };
    if (payload.ok && payload.data) setAssignmentResult(payload.data);
    setLoading(null);
  };

  const seedStats = async () => {
    if (!experimentId) return;
    setLoading("record");

    const programmatic = [
      { variant: "A", impression: 80, reply: 29, conversion: 12 },
      { variant: "B", impression: 76, reply: 24, conversion: 9 },
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
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
    const response = await fetch(`/api/experiments/${experimentId}/results?organizationId=${organizationId}&from=${encodeURIComponent(from)}`);
    const payload = (await response.json()) as { ok: boolean; data?: ExperimentResults };
    if (payload.ok && payload.data) setResults(payload.data);
    setLoading(null);
  };

  return (
    <main className="space-y-4">
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Voice Notes + Experimentos A/B</h1>
            <p className="text-sm text-zinc-400">Sprint 8 usable end-to-end · entorno mock-realista sin credenciales.</p>
          </div>
          <span className="rounded-lg border border-[#d4e83a]/40 bg-[#d4e83a]/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#d4e83a]">Sprint 8</span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="card p-4">
          <h3 className="text-lg font-semibold">Voice Notes endurecido</h3>
          <label className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
            <span>Consentimiento para voice clone</span>
            <input type="checkbox" checked={consentGranted} onChange={(e) => void saveConsent(e.target.checked)} className="h-4 w-4 accent-[#d4e83a]" />
          </label>
          <label className="mt-2 flex items-center gap-2 text-xs text-zinc-300">
            <input type="checkbox" checked={consentConfirmed} onChange={(e) => setConsentConfirmed(e.target.checked)} className="h-4 w-4 accent-[#d4e83a]" />
            Confirmo consentimiento explícito vigente antes de enviar.
          </label>

          <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} rows={4} className="mt-3 w-full rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" />

          <div className="mt-3 flex gap-2">
            <button onClick={generatePreview} disabled={!consentGranted || loading === "preview"} className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-3 py-1.5 text-sm text-[#d4e83a] disabled:opacity-40">{loading === "preview" ? "Generando..." : "Generar preview"}</button>
            <button onClick={sendVoice} disabled={!preview || loading === "send"} className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 disabled:opacity-40">{loading === "send" ? "Enviando..." : "Enviar nota de voz"}</button>
          </div>

          {uiError && <p className="mt-2 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-xs text-red-200">{uiError}</p>}

          {preview && (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-zinc-300">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Preview script</p>
              <p className="mt-1">{preview.script}</p>
              <p className="mt-2 text-xs text-zinc-500">Hash {preview.sourceTextHash.slice(0, 12)}... · model {preview.modelId} · {preview.state}</p>
            </div>
          )}
        </article>

        <article className="card p-4">
          <h3 className="text-lg font-semibold">Compliance y auditoría</h3>
          <div className="mt-3 rounded-xl border border-[#d4e83a]/25 bg-[#d4e83a]/10 p-3 text-sm">
            <p className="text-zinc-200">Estado consentimiento: <span className="font-semibold text-[#d4e83a]">{compliance?.consentStatus ?? "revoked"}</span></p>
            <p className="text-zinc-300">Último cambio: {compliance?.lastConsentDate ? new Date(compliance.lastConsentDate).toLocaleString() : "Sin registro"}</p>
            <button onClick={() => void saveConsent(false)} className="mt-2 rounded-lg border border-white/20 bg-white/5 px-3 py-1 text-xs text-zinc-200">Revocar consentimiento</button>
          </div>
          <div className="mt-3 max-h-56 overflow-auto rounded-xl border border-white/10 bg-white/[0.02] p-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="border-b border-white/10 px-2 py-2 text-xs text-zinc-300 last:border-0">
                <p className="font-semibold text-[#d4e83a]">{log.eventType}</p>
                <p>{log.message}</p>
                <p className="text-zinc-500">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!auditLogs.length && <p className="px-2 py-2 text-sm text-zinc-500">Sin eventos aún.</p>}
          </div>
        </article>
      </section>

      <section className="card p-4">
        <h3 className="text-lg font-semibold">Wizard de experimento A/B</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input value={goal} onChange={(e) => setGoal(e.target.value)} className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" placeholder="Objetivo" />
          <select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm">
            <option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="webchat">Webchat</option>
          </select>
          <textarea value={variantAOpener} onChange={(e) => setVariantAOpener(e.target.value)} rows={2} className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" />
          <textarea value={variantBOpener} onChange={(e) => setVariantBOpener(e.target.value)} rows={2} className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" />
        </div>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <textarea value={variantAFollowup} onChange={(e) => setVariantAFollowup(e.target.value)} rows={2} className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" />
          <textarea value={variantBFollowup} onChange={(e) => setVariantBFollowup(e.target.value)} rows={2} className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-zinc-400">Split tráfico A/B</span>
          <input type="range" min={5} max={95} value={trafficSplitA} onChange={(e) => setTrafficSplitA(Number(e.target.value))} className="accent-[#d4e83a]" />
          <span className="text-sm text-[#d4e83a]">{trafficSplitA}% / {100 - trafficSplitA}%</span>
          <button onClick={createExperiment} className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-3 py-1.5 text-sm text-[#d4e83a]">{loading === "experiment" ? "Creando..." : "Crear experimento"}</button>
        </div>

        {experiment && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
            <p>Estado actual: <span className="text-[#d4e83a]">{experiment.state}</span></p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["draft", "running", "paused", "completed"] as const).map((state) => (
                <button key={state} onClick={() => void transitionState(state)} className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-zinc-200">{loading === "state" ? "Actualizando..." : state}</button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="card p-4">
        <h3 className="text-lg font-semibold">Simulación y dashboard de resultados</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input value={simulationLead} onChange={(e) => setSimulationLead(e.target.value)} className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" placeholder="leadKey" />
          <button onClick={simulateAssignment} disabled={!experimentId} className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 disabled:opacity-40">{loading === "assignment" ? "Asignando..." : "Asignar variante"}</button>
          <button onClick={seedStats} disabled={!experimentId} className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 disabled:opacity-40">{loading === "record" ? "Registrando..." : "Registrar outcomes mock"}</button>
          <select value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))} className="rounded-lg border border-white/15 bg-[#101827] px-2 py-1 text-sm"><option value={1}>24h</option><option value={7}>7 días</option><option value={30}>30 días</option></select>
          <button onClick={loadResults} disabled={!experimentId} className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-3 py-1.5 text-sm text-[#d4e83a] disabled:opacity-40">{loading === "results" ? "Calculando..." : "Ver dashboard"}</button>
        </div>

        {assignmentResult && <p className="mt-2 text-sm text-zinc-300">Asignación determinística: variante {assignmentResult.variant} · bucket {assignmentResult.bucket} · estado experimento {assignmentResult.state}</p>}

        {results && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(["A", "B"] as const).map((variant) => (
              <div key={variant} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                <p className="font-semibold">Variante {variant}</p>
                <p className="text-zinc-400">Conversión: {(results.stats[variant].conversionRate * 100).toFixed(1)}%</p>
                <p className="text-zinc-400">Reply rate: {(results.stats[variant].replyRate * 100).toFixed(1)}%</p>
                <p className="text-zinc-500">Impresiones: {results.stats[variant].impressions}</p>
              </div>
            ))}
            <div className="rounded-xl border border-[#d4e83a]/35 bg-[#d4e83a]/10 p-3 text-sm text-[#d4e83a]">
              <p className="font-semibold">{winnerBadge}</p>
              <p>Lift B vs A: {results.liftPercent.toFixed(1)}%</p>
              <p>Confianza: {(results.winner.confidence * 100).toFixed(0)}% · badge {results.confidenceBadge}</p>
              <p className="text-zinc-300">{results.winner.reason}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
