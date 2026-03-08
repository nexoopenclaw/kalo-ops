"use client";

import { useMemo, useState } from "react";
import type { OnboardingTask, OnboardingTaskKey } from "@/lib/onboarding-service";

interface WorkspaceData {
  tasks: OnboardingTask[];
  state: {
    organizationId: string;
    completedTaskKeys: OnboardingTaskKey[];
    completedAt: string | null;
    updatedAt: string;
  };
  progress: {
    totalTasks: number;
    completedTasks: number;
    progressPercent: number;
    estimatedMinutesRemaining: number;
  };
}

export function OnboardingWorkspace({ initialData }: { initialData: WorkspaceData }) {
  const [data, setData] = useState(initialData);
  const [loadingTask, setLoadingTask] = useState<OnboardingTaskKey | null>(null);
  const isCompleted = data.progress.progressPercent === 100;

  const quickStart = useMemo(
    () => data.tasks.filter((task) => !data.state.completedTaskKeys.includes(task.key)).slice(0, 2),
    [data.tasks, data.state.completedTaskKeys],
  );

  async function toggleTask(taskKey: OnboardingTaskKey, checked: boolean) {
    setLoadingTask(taskKey);

    try {
      const response = await fetch("/api/onboarding/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskKey, checked, organizationId: data.state.organizationId }),
      });

      const payload = (await response.json()) as { ok: boolean; data?: WorkspaceData };
      if (payload.ok && payload.data) {
        setData(payload.data);
      }
    } finally {
      setLoadingTask(null);
    }
  }

  return (
    <main className="space-y-4">
      <section className="card p-5">
        <h1 className="text-2xl font-semibold">Onboarding Workspace</h1>
        <p className="text-sm text-zinc-400">Guía rápida para dejar tu operación lista para escalar en menos de 45 minutos.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Metric label="Progreso" value={`${data.progress.progressPercent}%`} highlight />
        <Metric label="Tareas completadas" value={`${data.progress.completedTasks}/${data.progress.totalTasks}`} />
        <Metric label="Tiempo estimado restante" value={`${data.progress.estimatedMinutesRemaining} min`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <article className="card p-4">
          <h2 className="text-lg font-semibold">Checklist guiado</h2>
          <div className="mt-3 space-y-2">
            {data.tasks.map((task) => {
              const checked = data.state.completedTaskKeys.includes(task.key);
              const busy = loadingTask === task.key;

              return (
                <label
                  key={task.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${checked ? "border-[#d4e83a]/45 bg-[#d4e83a]/10" : "border-white/10 bg-white/[0.02]"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={busy}
                    onChange={(event) => toggleTask(task.key, event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#d4e83a]"
                  />
                  <div>
                    <p className="text-sm font-semibold">{task.title}</p>
                    <p className="text-xs text-zinc-400">{task.description}</p>
                    <p className="mt-1 text-xs text-zinc-500">Estimado: {task.estimatedMinutes} min</p>
                  </div>
                </label>
              );
            })}
          </div>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-semibold">Quick-start recomendado</h2>
          <div className="mt-3 space-y-2">
            {quickStart.length > 0 ? (
              quickStart.map((task) => (
                <div key={task.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-sm font-semibold text-[#d4e83a]">{task.title}</p>
                  <p className="mt-1 text-xs text-zinc-300">{task.recommendation}</p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-[#d4e83a]/30 bg-[#d4e83a]/10 p-3 text-sm text-zinc-200">
                ✅ Onboarding completo. Tu workspace está listo para sprint de retención y expansión.
              </p>
            )}
          </div>

          {isCompleted ? (
            <p className="mt-3 text-xs text-zinc-500">Completado: {new Date(data.state.completedAt ?? data.state.updatedAt).toLocaleString("es-ES")}</p>
          ) : null}
        </article>
      </section>
    </main>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <article className="card p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${highlight ? "text-[#d4e83a]" : "text-white"}`}>{value}</p>
    </article>
  );
}
