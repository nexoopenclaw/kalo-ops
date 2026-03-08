export type AutomationTriggerType = "silence" | "keyword" | "stage_change" | "booking" | "payment";

export type AutomationActionType = "send_message" | "change_status" | "assign_setter" | "notify" | "add_tag";

export type AutomationConditionOperator = "equals" | "contains" | "greater_than" | "less_than" | "exists";

export interface AutomationTrigger {
  type: AutomationTriggerType;
  value?: string;
  windowMinutes?: number;
}

export interface AutomationCondition {
  id: string;
  field: string;
  operator: AutomationConditionOperator;
  value?: string;
}

export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  value?: string;
  channel?: "instagram" | "whatsapp" | "email" | "internal";
}

export interface AutomationWorkflow {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  active: boolean;
  executionCount: number;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationExecutionLog {
  id: string;
  organizationId: string;
  workflowId: string;
  status: "success" | "failed" | "skipped";
  summary: string;
  context: Record<string, unknown>;
  startedAt: string;
  finishedAt: string;
}

export interface CreateAutomationInput {
  organizationId: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
}

export interface UpdateAutomationInput {
  organizationId: string;
  workflowId: string;
  name?: string;
  description?: string;
  trigger?: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions?: AutomationAction[];
}

export interface ToggleAutomationInput {
  organizationId: string;
  workflowId: string;
  active?: boolean;
}

export interface SimulateAutomationRunInput {
  organizationId: string;
  workflowId: string;
  context?: Record<string, unknown>;
}

export interface AutomationRepository {
  list(organizationId: string): Promise<AutomationWorkflow[]>;
  create(input: CreateAutomationInput): Promise<AutomationWorkflow>;
  update(input: UpdateAutomationInput): Promise<AutomationWorkflow | null>;
  toggle(input: ToggleAutomationInput): Promise<AutomationWorkflow | null>;
  simulateRun(input: SimulateAutomationRunInput): Promise<AutomationExecutionLog | null>;
  listExecutionLogs(organizationId: string, workflowId?: string): Promise<AutomationExecutionLog[]>;
}

const now = Date.now();

const seedWorkflows: AutomationWorkflow[] = [
  {
    id: "wf_1",
    organizationId: "org_1",
    name: "No reply 30m follow-up",
    description: "Si no hay respuesta en 30 min, enviar mensaje de rescate y avisar setter.",
    trigger: { type: "silence", windowMinutes: 30 },
    conditions: [
      { id: "cond_1", field: "conversation.status", operator: "equals", value: "waiting_lead" },
      { id: "cond_2", field: "lead.score", operator: "greater_than", value: "60" },
    ],
    actions: [
      { id: "act_1", type: "send_message", channel: "whatsapp", value: "¿Te va bien si te mando 2 opciones de horario?" },
      { id: "act_2", type: "notify", channel: "internal", value: "Lead sin respuesta > 30m" },
    ],
    active: true,
    executionCount: 18,
    lastRunAt: new Date(now - 20 * 60 * 1000).toISOString(),
    createdAt: new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wf_2",
    organizationId: "org_1",
    name: "Booked -> assign closer",
    description: "Cuando una oportunidad llega a booked, asignar closer y tag de prioridad.",
    trigger: { type: "stage_change", value: "booked" },
    conditions: [{ id: "cond_3", field: "deal.value", operator: "greater_than", value: "5000" }],
    actions: [
      { id: "act_3", type: "assign_setter", value: "closer_team_a" },
      { id: "act_4", type: "add_tag", value: "priority_hot" },
    ],
    active: false,
    executionCount: 7,
    lastRunAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(now - 18 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const seedLogs: AutomationExecutionLog[] = [
  {
    id: "log_1",
    organizationId: "org_1",
    workflowId: "wf_1",
    status: "success",
    summary: "Follow-up enviado + notificación interna",
    context: { conversationId: "conv_12", leadId: "lead_8" },
    startedAt: new Date(now - 20 * 60 * 1000).toISOString(),
    finishedAt: new Date(now - 20 * 60 * 1000 + 800).toISOString(),
  },
];

class InMemoryAutomationRepository implements AutomationRepository {
  private workflows = [...seedWorkflows];
  private logs = [...seedLogs];

  async list(organizationId: string): Promise<AutomationWorkflow[]> {
    return this.workflows
      .filter((workflow) => workflow.organizationId === organizationId)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .map((item) => structuredClone(item));
  }

  async create(input: CreateAutomationInput): Promise<AutomationWorkflow> {
    const timestamp = new Date().toISOString();
    const created: AutomationWorkflow = {
      id: `wf_${Date.now()}`,
      organizationId: input.organizationId,
      name: input.name,
      description: input.description,
      trigger: { ...input.trigger },
      conditions: (input.conditions ?? []).map((condition) => ({ ...condition })),
      actions: input.actions.map((action) => ({ ...action })),
      active: true,
      executionCount: 0,
      lastRunAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.workflows = [created, ...this.workflows];
    return structuredClone(created);
  }

  async update(input: UpdateAutomationInput): Promise<AutomationWorkflow | null> {
    const found = this.workflows.find((workflow) => workflow.id === input.workflowId && workflow.organizationId === input.organizationId);
    if (!found) return null;

    if (typeof input.name === "string") found.name = input.name;
    if (typeof input.description === "string") found.description = input.description;
    if (input.trigger) found.trigger = { ...input.trigger };
    if (input.conditions) found.conditions = input.conditions.map((condition) => ({ ...condition }));
    if (input.actions) found.actions = input.actions.map((action) => ({ ...action }));
    found.updatedAt = new Date().toISOString();

    return structuredClone(found);
  }

  async toggle(input: ToggleAutomationInput): Promise<AutomationWorkflow | null> {
    const found = this.workflows.find((workflow) => workflow.id === input.workflowId && workflow.organizationId === input.organizationId);
    if (!found) return null;

    found.active = typeof input.active === "boolean" ? input.active : !found.active;
    found.updatedAt = new Date().toISOString();

    return structuredClone(found);
  }

  async simulateRun(input: SimulateAutomationRunInput): Promise<AutomationExecutionLog | null> {
    const found = this.workflows.find((workflow) => workflow.id === input.workflowId && workflow.organizationId === input.organizationId);
    if (!found) return null;

    const nowIso = new Date().toISOString();
    found.executionCount += 1;
    found.lastRunAt = nowIso;
    found.updatedAt = nowIso;

    const log: AutomationExecutionLog = {
      id: `log_${Date.now()}`,
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      status: found.active ? "success" : "skipped",
      summary: found.active ? "Simulación ejecutada con éxito" : "Workflow inactivo, ejecución omitida",
      context: input.context ?? {},
      startedAt: nowIso,
      finishedAt: new Date(Date.now() + 350).toISOString(),
    };

    this.logs = [log, ...this.logs];
    return structuredClone(log);
  }

  async listExecutionLogs(organizationId: string, workflowId?: string): Promise<AutomationExecutionLog[]> {
    return this.logs
      .filter((log) => log.organizationId === organizationId)
      .filter((log) => (workflowId ? log.workflowId === workflowId : true))
      .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))
      .map((item) => structuredClone(item));
  }
}

const repository: AutomationRepository = new InMemoryAutomationRepository();

export const automationService = {
  async list(organizationId = "org_1") {
    // TODO(Supabase): replace repository with persisted reads from `public.automations`.
    return repository.list(organizationId);
  },

  async create(input: CreateAutomationInput) {
    // TODO(Supabase): insert automation row + related conditions/actions in transaction.
    return repository.create(input);
  },

  async update(input: UpdateAutomationInput) {
    // TODO(Supabase): update automation definition and bump updated_at.
    return repository.update(input);
  },

  async toggle(input: ToggleAutomationInput) {
    // TODO(Supabase): persist active flag and sync edge cache if needed.
    return repository.toggle(input);
  },

  async simulateRun(input: SimulateAutomationRunInput) {
    // TODO(Meta Hooks): dispatch concrete actions to WhatsApp/Instagram API workers.
    // TODO(Supabase): persist execution log in `public.automation_logs`.
    return repository.simulateRun(input);
  },

  async listExecutionLogs(organizationId = "org_1", workflowId?: string) {
    // TODO(Supabase): query execution logs ordered by started_at desc.
    return repository.listExecutionLogs(organizationId, workflowId);
  },
};
