import { getPersistenceState } from "@/lib/in-memory-persistence";

export type OnboardingTaskKey =
  | "connect_channel"
  | "create_pipeline"
  | "import_leads"
  | "activate_automation"
  | "configure_alerts";

export interface OnboardingTask {
  key: OnboardingTaskKey;
  title: string;
  description: string;
  estimatedMinutes: number;
  recommendation: string;
}

export interface OnboardingState {
  organizationId: string;
  completedTaskKeys: OnboardingTaskKey[];
  completedAt: string | null;
  updatedAt: string;
}

export interface OnboardingProgress {
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  estimatedMinutesRemaining: number;
}

export interface OnboardingRepository {
  getState(organizationId: string): Promise<OnboardingState>;
  setTaskStatus(input: { organizationId: string; taskKey: OnboardingTaskKey; checked: boolean }): Promise<OnboardingState>;
}

const DEFAULT_TASKS: OnboardingTask[] = [
  {
    key: "connect_channel",
    title: "Conectar canal",
    description: "Vincula Instagram, WhatsApp o Email para empezar a capturar conversaciones.",
    estimatedMinutes: 8,
    recommendation: "Empieza por el canal con mayor volumen para obtener señales reales desde hoy.",
  },
  {
    key: "create_pipeline",
    title: "Crear primer pipeline",
    description: "Define etapas base (nuevo, calificado, booked, won/lost) para ordenar oportunidades.",
    estimatedMinutes: 10,
    recommendation: "Usa 4-6 etapas máximo para que el equipo mantenga velocidad.",
  },
  {
    key: "import_leads",
    title: "Importar leads",
    description: "Sube tu primer lote de leads para alimentar el CRM y los playbooks de follow-up.",
    estimatedMinutes: 12,
    recommendation: "Importa al menos 50 leads para validar scoring y priorización.",
  },
  {
    key: "activate_automation",
    title: "Activar primera automatización",
    description: "Configura una regla de no respuesta para recuperar conversaciones frías.",
    estimatedMinutes: 7,
    recommendation: "Empieza por una automatización simple para medir impacto sin sobre-optimizar.",
  },
  {
    key: "configure_alerts",
    title: "Configurar alertas",
    description: "Activa alertas críticas de SLA, backlog y caída de show-up rate.",
    estimatedMinutes: 6,
    recommendation: "Envía alertas a responsables directos, no a todo el equipo.",
  },
];

class InMemoryOnboardingRepository implements OnboardingRepository {
  async getState(organizationId: string): Promise<OnboardingState> {
    const state = getPersistenceState();
    const existing = state.onboardingStates.find((item) => item.organizationId === organizationId);

    if (existing) {
      return structuredClone(existing);
    }

    const created: OnboardingState = {
      organizationId,
      completedTaskKeys: [],
      completedAt: null,
      updatedAt: new Date().toISOString(),
    };

    state.onboardingStates = [created, ...state.onboardingStates];
    return structuredClone(created);
  }

  async setTaskStatus(input: { organizationId: string; taskKey: OnboardingTaskKey; checked: boolean }): Promise<OnboardingState> {
    const state = getPersistenceState();
    const current = await this.getState(input.organizationId);

    const nextKeys = input.checked
      ? Array.from(new Set([...current.completedTaskKeys, input.taskKey]))
      : current.completedTaskKeys.filter((key) => key !== input.taskKey);

    const next: OnboardingState = {
      ...current,
      completedTaskKeys: nextKeys,
      completedAt: nextKeys.length === DEFAULT_TASKS.length ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };

    state.onboardingStates = state.onboardingStates
      .filter((item) => item.organizationId !== input.organizationId)
      .concat(next)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

    return structuredClone(next);
  }
}

const repository: OnboardingRepository = new InMemoryOnboardingRepository();

function buildProgress(completedTaskKeys: OnboardingTaskKey[]): OnboardingProgress {
  const completedTasks = completedTaskKeys.length;
  const totalTasks = DEFAULT_TASKS.length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);
  const estimatedMinutesRemaining = DEFAULT_TASKS.filter((task) => !completedTaskKeys.includes(task.key)).reduce(
    (sum, task) => sum + task.estimatedMinutes,
    0,
  );

  return {
    totalTasks,
    completedTasks,
    progressPercent,
    estimatedMinutesRemaining,
  };
}

export const onboardingService = {
  tasks: DEFAULT_TASKS,

  async getWorkspace(organizationId = "org_1") {
    // TODO(Supabase): replace repository read with persisted onboarding state by organization.
    const state = await repository.getState(organizationId);
    return {
      state,
      tasks: DEFAULT_TASKS,
      progress: buildProgress(state.completedTaskKeys),
    };
  },

  async checkTask(input: { organizationId?: string; taskKey: OnboardingTaskKey; checked: boolean }) {
    const organizationId = input.organizationId ?? "org_1";
    // TODO(Supabase): upsert onboarding progress atomically.
    const state = await repository.setTaskStatus({
      organizationId,
      taskKey: input.taskKey,
      checked: input.checked,
    });

    return {
      state,
      tasks: DEFAULT_TASKS,
      progress: buildProgress(state.completedTaskKeys),
    };
  },
};
