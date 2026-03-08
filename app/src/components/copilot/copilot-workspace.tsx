"use client";

import { useMemo, useState } from "react";
import type { ConversationTurn, ObjectionType } from "@/lib/copilot-service";

type ContextOption = {
  id: string;
  label: string;
  conversationId: string;
  dealId: string;
  channel: "instagram" | "whatsapp" | "email" | "webchat" | "other";
  stage: string;
  forecastValue: string;
  lastInteraction: string;
  objective: string;
  transcript: ConversationTurn[];
};

type Props = {
  contextOptions: ContextOption[];
};

type SuggestResponse = {
  ok: boolean;
  data?: {
    suggestions: Array<{ id: string; text: string; intent: string; confidence: number }>;
    rationale: string;
  };
  error?: string;
};

type ClassifyResponse = {
  ok: boolean;
  data?: { category: ObjectionType; confidence: number; explanation: string };
  error?: string;
};

type SummaryResponse = {
  ok: boolean;
  data?: { summary: string; nextBestAction: string; risks: string[] };
  error?: string;
};

type ScoreResponse = {
  ok: boolean;
  data?: {
    scorecard: {
      claridad: number;
      empatia: number;
      cta: number;
      manejoObjecion: number;
      overall: number;
      highlights: string[];
      improvements: string[];
    };
  };
  error?: string;
};

const objectionLabels: Record<ObjectionType, string> = {
  precio: "Precio",
  timing: "Timing",
  confianza: "Confianza",
  urgencia: "Urgencia",
  competencia: "Competencia",
  otro: "Otro",
};

export function CopilotWorkspace({ contextOptions }: Props) {
  const [selectedContextId, setSelectedContextId] = useState(contextOptions[0]?.id ?? "");
  const [objectionInput, setObjectionInput] = useState("No sé si ahora es el mejor momento y además lo veo caro.");
  const [loading, setLoading] = useState<null | "suggest" | "classify" | "summarize" | "score">(null);

  const [suggestions, setSuggestions] = useState<SuggestResponse["data"]>();
  const [classification, setClassification] = useState<ClassifyResponse["data"]>();
  const [summary, setSummary] = useState<SummaryResponse["data"]>();
  const [score, setScore] = useState<ScoreResponse["data"]>();

  const selected = useMemo(
    () => contextOptions.find((item) => item.id === selectedContextId) ?? contextOptions[0],
    [contextOptions, selectedContextId],
  );

  const transcript = selected?.transcript ?? [];

  const contextPayload = {
    organizationId: "org_1",
    conversationId: selected?.conversationId,
    dealId: selected?.dealId,
    leadName: selected?.label,
    channel: selected?.channel,
  };

  const runSuggest = async () => {
    setLoading("suggest");
    const response = await fetch("/api/copilot/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: contextPayload,
        conversation: transcript,
        objective: selected?.objective ?? "agendar llamada",
        tone: "premium",
      }),
    });
    const payload = (await response.json()) as SuggestResponse;
    if (response.ok && payload.ok && payload.data) setSuggestions(payload.data);
    setLoading(null);
  };

  const runClassify = async () => {
    setLoading("classify");
    const response = await fetch("/api/copilot/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: contextPayload, message: objectionInput }),
    });
    const payload = (await response.json()) as ClassifyResponse;
    if (response.ok && payload.ok && payload.data) setClassification(payload.data);
    setLoading(null);
  };

  const runSummarize = async () => {
    setLoading("summarize");
    const response = await fetch("/api/copilot/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: contextPayload, conversation: transcript }),
    });
    const payload = (await response.json()) as SummaryResponse;
    if (response.ok && payload.ok && payload.data) setSummary(payload.data);
    setLoading(null);
  };

  const runScore = async () => {
    setLoading("score");
    const response = await fetch("/api/copilot/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: contextPayload, conversation: transcript }),
    });
    const payload = (await response.json()) as ScoreResponse;
    if (response.ok && payload.ok && payload.data) setScore(payload.data);
    setLoading(null);
  };

  return (
    <main className="space-y-4">
      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">AI Copilot Core</h1>
            <p className="text-sm text-zinc-400">Asistencia contextual para setters/closers (modo mock sin credenciales).</p>
          </div>
          <span className="rounded-lg border border-[#d4e83a]/40 bg-[#d4e83a]/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#d4e83a]">
            Sprint 7
          </span>
        </div>
      </section>

      <section className="card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-500">Contexto activo</p>
            <select
              value={selectedContextId}
              onChange={(event) => setSelectedContextId(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm"
            >
              {contextOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} · {item.channel} · {item.stage}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-sm text-zinc-300">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Deal Snapshot</p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-md border border-[#d4e83a]/40 bg-[#d4e83a]/10 px-2 py-0.5 text-[#d4e83a]">{selected.stage}</span>
                <span>{selected.forecastValue}</span>
                <span className="text-zinc-500">Último touch · {selected.lastInteraction}</span>
              </div>
              <p className="text-xs text-zinc-400">Objetivo actual: {selected.objective}</p>
              <div className="mt-2 space-y-1">
                {transcript.slice(0, 3).map((turn, index) => (
                  <div key={`${turn.role}-${index}`} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{turn.role === "agent" ? "Setter" : turn.role === "lead" ? "Lead" : "Sistema"}</p>
                    <p className="text-zinc-300">{turn.text}</p>
                    {turn.at && <p className="mt-1 text-[10px] text-zinc-500">{turn.at}</p>}
                  </div>
                ))}
                {transcript.length > 3 && <p className="text-[11px] text-zinc-500">…{transcript.length - 3} mensajes adicionales</p>}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Sugerencias de respuesta</h3>
            <button onClick={runSuggest} className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-3 py-1.5 text-sm text-[#d4e83a]">
              {loading === "suggest" ? "Generando..." : "Generar"}
            </button>
          </div>
          <div className="space-y-2">
            {(suggestions?.suggestions ?? []).map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
                <p className="text-zinc-200">{item.text}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {item.intent} · conf {Math.round(item.confidence * 100)}%
                </p>
              </div>
            ))}
            {!suggestions && <p className="text-sm text-zinc-500">Sin sugerencias aún.</p>}
          </div>
        </article>

        <article className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Clasificador de objeción</h3>
            <button onClick={runClassify} className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-3 py-1.5 text-sm text-[#d4e83a]">
              {loading === "classify" ? "Analizando..." : "Clasificar"}
            </button>
          </div>
          <textarea
            value={objectionInput}
            onChange={(event) => setObjectionInput(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm"
          />
          {classification && (
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
              <p className="text-zinc-300">
                Categoría: <span className="text-[#d4e83a]">{objectionLabels[classification.category]}</span> · {Math.round(classification.confidence * 100)}%
              </p>
              <p className="mt-1 text-xs text-zinc-500">{classification.explanation}</p>
            </div>
          )}
        </article>

        <article className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Resumen conversacional</h3>
            <button onClick={runSummarize} className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-3 py-1.5 text-sm text-[#d4e83a]">
              {loading === "summarize" ? "Resumiendo..." : "Generar"}
            </button>
          </div>
          {summary ? (
            <div className="space-y-2 text-sm">
              <p className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-zinc-300">{summary.summary}</p>
              <p className="rounded-lg border border-[#d4e83a]/25 bg-[#d4e83a]/8 p-3 text-zinc-200">Next: {summary.nextBestAction}</p>
              <ul className="list-disc space-y-1 pl-5 text-zinc-400">
                {summary.risks.map((risk, idx) => (
                  <li key={`${risk}-${idx}`}>{risk}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Sin resumen generado.</p>
          )}
        </article>

        <article className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Scorecard de calidad</h3>
            <button onClick={runScore} className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-3 py-1.5 text-sm text-[#d4e83a]">
              {loading === "score" ? "Evaluando..." : "Evaluar"}
            </button>
          </div>
          {score ? (
            <div className="space-y-2 text-sm">
              {[
                ["Claridad", score.scorecard.claridad],
                ["Empatía", score.scorecard.empatia],
                ["CTA", score.scorecard.cta],
                ["Manejo objeción", score.scorecard.manejoObjecion],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">{label}</span>
                    <span className="text-[#d4e83a]">{value}/100</span>
                  </div>
                </div>
              ))}
              <p className="rounded-lg border border-[#d4e83a]/30 bg-[#d4e83a]/10 p-2 text-center font-semibold text-[#d4e83a]">Overall {score.scorecard.overall}/100</p>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Highlights</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-zinc-400">
                  {score.scorecard.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Mejoras</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-zinc-400">
                  {score.scorecard.improvements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Sin evaluación aún.</p>
          )}
        </article>
      </section>
    </main>
  );
}
