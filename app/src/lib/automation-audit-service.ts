export interface AutomationAuditEntry {
  id: string;
  organizationId: string;
  workflowId: string;
  workflowName: string;
  correlationId: string;
  triggerType: string;
  inputs: Record<string, unknown>;
  decisions: Record<string, unknown>;
  outputs: Record<string, unknown>;
  status: "success" | "failed" | "skipped";
  durationMs: number;
  createdAt: string;
}

const globalKey = "__kaloOpsAutomationAudit__";

function store(): AutomationAuditEntry[] {
  const scoped = globalThis as typeof globalThis & { [globalKey]?: AutomationAuditEntry[] };
  if (!scoped[globalKey]) scoped[globalKey] = [];
  return scoped[globalKey] as AutomationAuditEntry[];
}

export const automationAuditService = {
  record(entry: Omit<AutomationAuditEntry, "id" | "createdAt">): AutomationAuditEntry {
    const created: AutomationAuditEntry = {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      ...entry,
    };
    store().unshift(created);
    return created;
  },

  list(organizationId: string, limit = 25): AutomationAuditEntry[] {
    return store().filter((item) => item.organizationId === organizationId).slice(0, limit).map((item) => ({ ...item }));
  },
};
