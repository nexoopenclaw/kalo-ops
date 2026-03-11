"use client";

import { useEffect, useMemo, useState } from "react";
import type { AutomationActionType, AutomationTriggerType, AutomationWorkflow } from "@/lib/automation-service";

const triggerLabels: Record<AutomationTriggerType, string> = {
  silence: "Silencio",
  keyword: "Keyword",
  stage_change: "Cambio de etapa",
  booking: "Booking",
  payment: "Pago",
};

const actionLabels: Record<AutomationActionType, string> = {
  send_message: "Enviar mensaje",
  change_status: "Cambiar status",
  assign_setter: "Asignar setter",
  notify: "Notificar",
  add_tag: "Añadir tag",
};

type Props = { initialWorkflows: AutomationWorkflow[] };

type ExecutionItem = {
  id: string;
  workflowName: string;
  status: "success" | "failed" | "skipped";
  reason: string;
  durationMs: number;
  startedAt: string;
};

type QueueStatus = { total: number; pending: number; running: number; failed: number; completed: number };
type AuditItem = { id: string; workflowName: string; correlationId: string; status: "success" | "failed" | "skipped"; durationMs: number; createdAt: string };

export function AutomationWorkspace({ initialWorkflows }: Props) {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [executions, setExecutions] = useState<ExecutionItem[]>([]);
  const [queue, setQueue] = useState<QueueStatus>({ total: 0, pending: 0, running: 0, failed: 0, completed: 0 });
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>("silence");
  const [triggerValue, setTriggerValue] = useState("");
  const [contextText, setContextText] = useState('{"conversationId":"conv_2","leadId":"lead_2","leadScore":72}');

  const activeCount = useMemo(() => workflows.filter((workflow) => workflow.active).length, [workflows]);

  const refreshExecutionCenter = async () => {
    const [qRes, eRes, aRes] = await Promise.all([
      fetch("/api/automations/queue/status?organizationId=org_1", { cache: "no-store" }),
      fetch("/api/automations/executions?organizationId=org_1&limit=8", { cache: "no-store" }),
      fetch("/api/automations/audit?organizationId=org_1&limit=8", { cache: "no-store" }),
    ]);
    const qJson = (await qRes.json()) as { data: QueueStatus };
    const eJson = (await eRes.json()) as { data: ExecutionItem[] };
    const aJson = (await aRes.json()) as { data: AuditItem[] };
    setQueue(qJson.data ?? { total: 0, pending: 0, running: 0, failed: 0, completed: 0 });
    setExecutions(eJson.data ?? []);
    setAudit(aJson.data ?? []);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void refreshExecutionCenter();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const runManualTrigger = async () => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(contextText) as Record<string, unknown>;
    } catch {
      alert("JSON de contexto inválido");
      return;
    }

    await fetch("/api/automations/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: "org_1", triggerType, triggerValue: triggerValue || undefined, context: parsed }),
    });

    await refreshExecutionCenter();
  };

  const enqueueAndRun = async () => {
    await fetch("/api/automations/queue/enqueue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: "org_1", triggerType, triggerValue: triggerValue || undefined, context: { conversationId: "conv_1", leadId: "lead_1", leadScore: 88 } }),
    });
    await fetch("/api/automations/queue/run-next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: "org_1" }),
    });

    await refreshExecutionCenter();
  };

  return (
    <main className="space-y-4">
      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Automation Engine</h1>
            <p className="text-sm text-zinc-400">Constructor no-code de workflows con ejecución segura en mock.</p>
          </div>
          <span className="rounded-md border border-[#d4e83a]/35 bg-[#d4e83a]/10 px-2 py-1 text-xs text-[#d4e83a]">{activeCount} activos</span>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Workflows</h2>
        <div className="mt-3 space-y-2">
          {workflows.map((workflow) => (
            <article key={workflow.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="font-semibold">{workflow.name}</p>
              <p className="text-sm text-zinc-400">{workflow.description || "Sin descripción"}</p>
              <p className="text-xs text-zinc-500 mt-1">Trigger: {triggerLabels[workflow.trigger.type]} · Exec: {workflow.executionCount}</p>
              <button
                onClick={() => setWorkflows((prev) => prev.map((item) => (item.id === workflow.id ? { ...item, active: !item.active } : item)))}
                className={`mt-2 rounded-md border px-3 py-1 text-xs ${workflow.active ? "border-emerald-400/45 bg-emerald-500/10 text-emerald-200" : "border-zinc-500/45 bg-zinc-500/10 text-zinc-300"}`}
              >
                {workflow.active ? "Activo" : "Inactivo"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Execution Center</h2>
        <p className="text-sm text-zinc-400">Fiabilidad del executor + cola en memoria (modo safe mock).</p>

        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {[
            ["Queue size", queue.total],
            ["Pendientes", queue.pending],
            ["Running", queue.running],
            ["Fallidas", queue.failed],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="text-[#d4e83a] text-lg">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-2">Trigger manual (safe mock)</p>
          <div className="grid gap-2 md:grid-cols-3">
            <select value={triggerType} onChange={(e) => setTriggerType(e.target.value as AutomationTriggerType)} className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm">
              {Object.entries(triggerLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <input value={triggerValue} onChange={(e) => setTriggerValue(e.target.value)} placeholder="Valor opcional" className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" />
            <button onClick={runManualTrigger} className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-4 py-2 text-sm font-medium text-[#d4e83a]">Ejecutar ahora</button>
          </div>
          <textarea rows={3} value={contextText} onChange={(e) => setContextText(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm" />
          <button onClick={enqueueAndRun} className="mt-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-zinc-300 hover:border-[#d4e83a]/35 hover:text-[#d4e83a]">Encolar + run-next</button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-zinc-500">
              <tr>
                <th className="py-2 pr-3">Workflow</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Razón</th>
                <th className="py-2 pr-3">Duración</th>
                <th className="py-2 pr-3">Inicio</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((item) => (
                <tr key={item.id} className="border-t border-white/10 text-zinc-300">
                  <td className="py-2 pr-3">{item.workflowName}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${item.status === "success" ? "bg-emerald-500/15 text-emerald-200" : item.status === "failed" ? "bg-red-500/15 text-red-200" : "bg-zinc-500/20 text-zinc-200"}`}>{item.status}</span>
                  </td>
                  <td className="py-2 pr-3">{item.reason}</td>
                  <td className="py-2 pr-3">{item.durationMs} ms</td>
                  <td className="py-2 pr-3">{new Date(item.startedAt).toLocaleString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Audit trail (últimas ejecuciones)</h2>
        <div className="mt-3 space-y-2 text-xs">
          {audit.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-zinc-300">
              <p>{item.workflowName} · <span className="text-[#d4e83a]">{item.status}</span> · {item.durationMs}ms</p>
              <p className="text-zinc-500">corr: {item.correlationId.slice(0, 8)} · {new Date(item.createdAt).toLocaleString("es-ES")}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
