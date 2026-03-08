import { automationService, type AutomationAction, type AutomationCondition, type AutomationTriggerType, type AutomationWorkflow } from "@/lib/automation-service";
import { inboxService, type ConversationStatus } from "@/lib/inbox-service";
import { crmService } from "@/lib/crm-service";

export type AutomationExecutionStatus = "success" | "failed" | "skipped";

export interface AutomationTriggerPayload {
  organizationId: string;
  triggerType: AutomationTriggerType;
  triggerValue?: string;
  workflowId?: string;
  context?: Record<string, unknown>;
}

export interface AutomationExecutionEntry {
  id: string;
  organizationId: string;
  workflowId: string;
  workflowName: string;
  status: AutomationExecutionStatus;
  reason: string;
  durationMs: number;
  trigger: AutomationTriggerPayload;
  actionResults: Array<{ actionId: string; type: AutomationAction["type"]; status: "success" | "skipped"; detail: string }>;
  startedAt: string;
  finishedAt: string;
}

type RuntimeState = {
  conversationStatus: Map<string, ConversationStatus>;
  assignedSetter: Map<string, string>;
  leadTags: Map<string, Set<string>>;
  notifications: Array<{ id: string; text: string; createdAt: string }>;
  outboundMessages: Array<{ id: string; channel: string; body: string; conversationId: string; createdAt: string }>;
};

const executionLog: AutomationExecutionEntry[] = [];

const runtimeState: RuntimeState = {
  conversationStatus: new Map(),
  assignedSetter: new Map(),
  leadTags: new Map(),
  notifications: [],
  outboundMessages: [],
};

let hydrated = false;

async function hydrateState(organizationId: string) {
  if (hydrated) return;
  const conversations = await inboxService.listConversations();
  conversations
    .filter((item) => item.organizationId === organizationId)
    .forEach((item) => {
      runtimeState.conversationStatus.set(item.id, item.status);
      if (item.assignedSetterId) runtimeState.assignedSetter.set(item.id, item.assignedSetterId);
      if (!runtimeState.leadTags.has(item.leadId)) runtimeState.leadTags.set(item.leadId, new Set());
    });
  hydrated = true;
}

function getPath(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, source);
}

function evaluateCondition(condition: AutomationCondition, state: Record<string, unknown>): boolean {
  const left = getPath(state, condition.field);
  const right = condition.value;

  switch (condition.operator) {
    case "equals":
      return String(left ?? "") === String(right ?? "");
    case "contains":
      return String(left ?? "").toLowerCase().includes(String(right ?? "").toLowerCase());
    case "greater_than":
      return Number(left ?? 0) > Number(right ?? 0);
    case "less_than":
      return Number(left ?? 0) < Number(right ?? 0);
    case "exists":
      return left !== undefined && left !== null && String(left).length > 0;
    default:
      return false;
  }
}

function triggerMatches(workflow: AutomationWorkflow, payload: AutomationTriggerPayload): boolean {
  if (workflow.trigger.type !== payload.triggerType) return false;
  if (payload.workflowId && payload.workflowId !== workflow.id) return false;
  if (workflow.trigger.value && payload.triggerValue) {
    return workflow.trigger.value === payload.triggerValue;
  }
  return true;
}

async function executeAction(action: AutomationAction, context: Record<string, unknown>): Promise<{ status: "success" | "skipped"; detail: string }> {
  const conversationId = String(context.conversationId ?? "");
  const leadId = String(context.leadId ?? "");
  const now = new Date().toISOString();

  switch (action.type) {
    case "send_message": {
      if (!conversationId) return { status: "skipped", detail: "Sin conversationId en contexto" };
      runtimeState.outboundMessages.unshift({
        id: `out_${Date.now()}`,
        channel: action.channel ?? "internal",
        body: action.value ?? "Mensaje automático",
        conversationId,
        createdAt: now,
      });
      return { status: "success", detail: "Mensaje encolado en mock" };
    }
    case "change_status": {
      if (!conversationId || !action.value) return { status: "skipped", detail: "Falta conversationId o status" };
      runtimeState.conversationStatus.set(conversationId, action.value as ConversationStatus);
      return { status: "success", detail: `Status cambiado a ${action.value}` };
    }
    case "assign_setter": {
      if (!conversationId || !action.value) return { status: "skipped", detail: "Falta conversationId o setter" };
      runtimeState.assignedSetter.set(conversationId, action.value);
      return { status: "success", detail: `Setter asignado: ${action.value}` };
    }
    case "notify": {
      runtimeState.notifications.unshift({ id: `notif_${Date.now()}`, text: action.value ?? "Notificación automática", createdAt: now });
      return { status: "success", detail: "Notificación interna creada" };
    }
    case "add_tag": {
      if (!leadId || !action.value) return { status: "skipped", detail: "Falta leadId o tag" };
      const existing = runtimeState.leadTags.get(leadId) ?? new Set<string>();
      existing.add(action.value);
      runtimeState.leadTags.set(leadId, existing);
      return { status: "success", detail: `Tag añadida: ${action.value}` };
    }
    default:
      return { status: "skipped", detail: "Acción no soportada" };
  }
}

export const automationExecutor = {
  async executeTrigger(payload: AutomationTriggerPayload): Promise<AutomationExecutionEntry[]> {
    await hydrateState(payload.organizationId);

    const workflows = (await automationService.list(payload.organizationId)).filter((workflow) => workflow.active).filter((workflow) => triggerMatches(workflow, payload));

    if (workflows.length === 0) {
      return [];
    }

    const deals = await crmService.listDeals(payload.organizationId);

    const entries: AutomationExecutionEntry[] = [];
    for (const workflow of workflows) {
      const started = Date.now();
      const context = {
        ...(payload.context ?? {}),
        conversation: {
          status: runtimeState.conversationStatus.get(String(payload.context?.conversationId ?? "")),
          assignedSetterId: runtimeState.assignedSetter.get(String(payload.context?.conversationId ?? "")),
        },
        lead: {
          score: Number(payload.context?.leadScore ?? 0),
          tags: Array.from(runtimeState.leadTags.get(String(payload.context?.leadId ?? "")) ?? []),
        },
        deal: deals.find((item) => item.id === payload.context?.dealId) ?? null,
      } as Record<string, unknown>;

      const conditionsOk = workflow.conditions.every((condition) => evaluateCondition(condition, context));

      const actionResults: AutomationExecutionEntry["actionResults"] = [];
      let status: AutomationExecutionStatus = "success";
      let reason = "Workflow ejecutado con éxito";

      if (!conditionsOk) {
        status = "skipped";
        reason = "Condiciones no cumplidas";
      } else {
        for (const action of workflow.actions) {
          const result = await executeAction(action, payload.context ?? {});
          actionResults.push({ actionId: action.id, type: action.type, status: result.status, detail: result.detail });
        }
      }

      const finishedAt = new Date().toISOString();
      const entry: AutomationExecutionEntry = {
        id: `exec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        organizationId: payload.organizationId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        status,
        reason,
        durationMs: Date.now() - started,
        trigger: payload,
        actionResults,
        startedAt: new Date(started).toISOString(),
        finishedAt,
      };

      executionLog.unshift(entry);
      entries.push(entry);

      await automationService.simulateRun({
        organizationId: payload.organizationId,
        workflowId: workflow.id,
        context: {
          ...(payload.context ?? {}),
          executorStatus: status,
          reason,
          durationMs: entry.durationMs,
        },
      });
    }

    return entries;
  },

  listExecutions(organizationId: string, limit = 30): AutomationExecutionEntry[] {
    return executionLog.filter((item) => item.organizationId === organizationId).slice(0, limit).map((item) => structuredClone(item));
  },
};
