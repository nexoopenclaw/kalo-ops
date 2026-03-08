"use client";

import { useMemo, useState } from "react";
import type { AutomationActionType, AutomationTriggerType, AutomationWorkflow } from "@/lib/automation-service";

const triggerLabels: Record<AutomationTriggerType, string> = {
  silence: "Silence",
  keyword: "Keyword",
  stage_change: "Stage change",
  booking: "Booking",
  payment: "Payment",
};

const actionLabels: Record<AutomationActionType, string> = {
  send_message: "Send message",
  change_status: "Change status",
  assign_setter: "Assign setter",
  notify: "Notify",
  add_tag: "Add tag",
};

type Props = {
  initialWorkflows: AutomationWorkflow[];
};

type WorkflowDraft = {
  id?: string;
  name: string;
  description: string;
  triggerType: AutomationTriggerType;
  triggerValue: string;
  conditionsText: string;
  actionType: AutomationActionType;
  actionValue: string;
};

const emptyDraft: WorkflowDraft = {
  name: "",
  description: "",
  triggerType: "silence",
  triggerValue: "",
  conditionsText: "",
  actionType: "send_message",
  actionValue: "",
};

function formatDate(iso: string | null): string {
  if (!iso) return "Sin ejecución";
  return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export function AutomationWorkspace({ initialWorkflows }: Props) {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<WorkflowDraft>(emptyDraft);

  const activeCount = useMemo(() => workflows.filter((workflow) => workflow.active).length, [workflows]);

  const openCreate = () => {
    setDraft(emptyDraft);
    setDrawerOpen(true);
  };

  const openEdit = (workflow: AutomationWorkflow) => {
    setDraft({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description ?? "",
      triggerType: workflow.trigger.type,
      triggerValue: workflow.trigger.value ?? workflow.trigger.windowMinutes?.toString() ?? "",
      conditionsText: workflow.conditions.map((condition) => `${condition.field} ${condition.operator} ${condition.value ?? ""}`.trim()).join("\n"),
      actionType: workflow.actions[0]?.type ?? "send_message",
      actionValue: workflow.actions[0]?.value ?? "",
    });
    setDrawerOpen(true);
  };

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows((prev) =>
      prev.map((workflow) => (workflow.id === workflowId ? { ...workflow, active: !workflow.active, updatedAt: new Date().toISOString() } : workflow)),
    );
  };

  const submitDraft = () => {
    if (!draft.name.trim()) return;

    const now = new Date().toISOString();
    const mappedConditions = draft.conditionsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item, index) => ({ id: `cond_local_${index}_${Date.now()}`, field: item, operator: "contains" as const, value: "true" }));

    const mappedWorkflow: AutomationWorkflow = {
      id: draft.id ?? `wf_local_${Date.now()}`,
      organizationId: "org_1",
      name: draft.name,
      description: draft.description,
      trigger: {
        type: draft.triggerType,
        value: draft.triggerValue || undefined,
        windowMinutes: draft.triggerType === "silence" ? Number(draft.triggerValue || 30) : undefined,
      },
      conditions: mappedConditions,
      actions: [{ id: `act_local_${Date.now()}`, type: draft.actionType, value: draft.actionValue }],
      active: true,
      executionCount: draft.id ? workflows.find((workflow) => workflow.id === draft.id)?.executionCount ?? 0 : 0,
      lastRunAt: draft.id ? workflows.find((workflow) => workflow.id === draft.id)?.lastRunAt ?? null : null,
      createdAt: draft.id ? workflows.find((workflow) => workflow.id === draft.id)?.createdAt ?? now : now,
      updatedAt: now,
    };

    setWorkflows((prev) => {
      if (draft.id) {
        return prev.map((workflow) => (workflow.id === draft.id ? mappedWorkflow : workflow));
      }
      return [mappedWorkflow, ...prev];
    });

    setDrawerOpen(false);
    setDraft(emptyDraft);
  };

  return (
    <main className="space-y-4">
      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Automation Engine</h1>
            <p className="text-sm text-zinc-400">No-code workflow builder mock para trigger → conditions → actions.</p>
          </div>
          <button onClick={openCreate} className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-4 py-2 text-sm font-medium text-[#d4e83a]">
            + Nuevo workflow
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Trigger</p>
          <h3 className="mt-2 text-lg font-semibold">Evento de entrada</h3>
          <p className="mt-1 text-sm text-zinc-400">Silence, keyword, stage change, booking o payment.</p>
        </article>
        <article className="card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Conditions</p>
          <h3 className="mt-2 text-lg font-semibold">Reglas de filtrado</h3>
          <p className="mt-1 text-sm text-zinc-400">Campo + operador para segmentar qué leads ejecutan la automatización.</p>
        </article>
        <article className="card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Actions</p>
          <h3 className="mt-2 text-lg font-semibold">Salida operacional</h3>
          <p className="mt-1 text-sm text-zinc-400">Mensajes, status, asignaciones, avisos internos y tags.</p>
        </article>
      </section>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Workflows</h2>
          <span className="rounded-md border border-[#d4e83a]/35 bg-[#d4e83a]/10 px-2 py-1 text-xs text-[#d4e83a]">{activeCount} activos</span>
        </div>

        <div className="space-y-2">
          {workflows.map((workflow) => (
            <article key={workflow.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-zinc-100">{workflow.name}</h3>
                  <p className="text-sm text-zinc-400">{workflow.description || "Sin descripción"}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Trigger: <span className="text-zinc-300">{triggerLabels[workflow.trigger.type]}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(workflow)}
                    className="rounded-md border border-white/15 px-3 py-1 text-xs text-zinc-300 hover:border-[#d4e83a]/30 hover:text-[#d4e83a]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleWorkflow(workflow.id)}
                    className={`rounded-md border px-3 py-1 text-xs ${
                      workflow.active
                        ? "border-emerald-400/45 bg-emerald-500/10 text-emerald-200"
                        : "border-zinc-500/45 bg-zinc-500/10 text-zinc-300"
                    }`}
                  >
                    {workflow.active ? "Activo" : "Inactivo"}
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-xs text-zinc-500">Exec count</p>
                  <p className="text-[#d4e83a]">{workflow.executionCount}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 md:col-span-2">
                  <p className="text-xs text-zinc-500">Last run</p>
                  <p className="text-zinc-300">{formatDate(workflow.lastRunAt)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60" onClick={() => setDrawerOpen(false)}>
          <aside className="h-full w-full max-w-xl border-l border-white/10 bg-[#0b1320] p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{draft.id ? "Editar workflow" : "Crear workflow"}</h3>
              <button className="rounded-lg border border-white/15 px-2 py-1 text-sm text-zinc-300" onClick={() => setDrawerOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nombre del workflow"
                className="w-full rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm outline-none focus:border-[#d4e83a]/45"
              />
              <textarea
                rows={2}
                value={draft.description}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Descripción operacional"
                className="w-full rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm outline-none focus:border-[#d4e83a]/45"
              />

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Trigger</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <select
                    value={draft.triggerType}
                    onChange={(event) => setDraft((prev) => ({ ...prev, triggerType: event.target.value as AutomationTriggerType }))}
                    className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm"
                  >
                    {Object.entries(triggerLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={draft.triggerValue}
                    onChange={(event) => setDraft((prev) => ({ ...prev, triggerValue: event.target.value }))}
                    placeholder="Valor trigger (keyword, minutos, stage...)"
                    className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Conditions</p>
                <textarea
                  rows={4}
                  value={draft.conditionsText}
                  onChange={(event) => setDraft((prev) => ({ ...prev, conditionsText: event.target.value }))}
                  placeholder="Una condición por línea"
                  className="w-full rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Actions</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <select
                    value={draft.actionType}
                    onChange={(event) => setDraft((prev) => ({ ...prev, actionType: event.target.value as AutomationActionType }))}
                    className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm"
                  >
                    {Object.entries(actionLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={draft.actionValue}
                    onChange={(event) => setDraft((prev) => ({ ...prev, actionValue: event.target.value }))}
                    placeholder="Payload de acción"
                    className="rounded-lg border border-white/15 bg-[#101827] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <button onClick={submitDraft} className="rounded-lg border border-[#d4e83a]/45 bg-[#d4e83a]/15 px-4 py-2 text-sm font-medium text-[#d4e83a]">
                {draft.id ? "Guardar cambios" : "Crear workflow"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
