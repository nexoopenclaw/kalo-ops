import { automationService } from "@/lib/automation-service";
import { attributionService } from "@/lib/attribution-service";
import { crmService } from "@/lib/crm-service";

export interface RiskWorkflow {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  enabled: boolean;
  thresholdDays: number;
  actionLabel: string;
  lastTriggeredAt: string | null;
}

export interface RiskAlertEvent {
  id: string;
  organizationId: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  dealId?: string;
  createdAt: string;
}

export interface RiskCockpitData {
  generatedAt: string;
  totals: {
    dealsAtRisk: number;
    revenueAtRisk: number;
    activeRules: number;
    suggestedActions: number;
  };
  dealsAtRisk: Array<{
    dealId: string;
    leadName: string;
    ownerName: string;
    stage: string;
    inactiveDays: number;
    value: number;
    currency: string;
  }>;
  workflows: RiskWorkflow[];
  recentAlerts: RiskAlertEvent[];
  recommendations: string[];
}

const seedWorkflows: RiskWorkflow[] = [
  {
    id: "risk_wf_1",
    organizationId: "org_1",
    name: "Rescate automático · Deal estancado",
    description: "Si el deal supera 4 días sin actividad, crear tarea y notificar owner.",
    enabled: true,
    thresholdDays: 4,
    actionLabel: "Notificar owner + tarea de rescate",
    lastTriggeredAt: null,
  },
  {
    id: "risk_wf_2",
    organizationId: "org_1",
    name: "Escalado founder · Alto valor",
    description: "Si un deal > €8k queda estancado 3 días, escalar al founder.",
    enabled: true,
    thresholdDays: 3,
    actionLabel: "Escalar al founder en canal interno",
    lastTriggeredAt: null,
  },
  {
    id: "risk_wf_3",
    organizationId: "org_1",
    name: "Nurture no-show",
    description: "Si el lead cae a riesgo en stage booked/show, activar secuencia de nurture.",
    enabled: false,
    thresholdDays: 2,
    actionLabel: "Activar secuencia post no-show",
    lastTriggeredAt: null,
  },
];

class InMemoryRiskAutomationRepository {
  private workflows = [...seedWorkflows];
  private alerts: RiskAlertEvent[] = [];

  async listWorkflows(organizationId: string): Promise<RiskWorkflow[]> {
    return this.workflows.filter((wf) => wf.organizationId === organizationId).map((wf) => ({ ...wf }));
  }

  async toggleWorkflow(organizationId: string, workflowId: string, enabled: boolean): Promise<RiskWorkflow | null> {
    const found = this.workflows.find((wf) => wf.organizationId === organizationId && wf.id === workflowId);
    if (!found) return null;
    found.enabled = enabled;
    return { ...found };
  }

  async listAlerts(organizationId: string): Promise<RiskAlertEvent[]> {
    return this.alerts
      .filter((alert) => alert.organizationId === organizationId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 12)
      .map((alert) => ({ ...alert }));
  }

  async insertAlerts(alerts: RiskAlertEvent[]) {
    this.alerts = [...alerts, ...this.alerts].slice(0, 120);
  }

  async markTriggered(organizationId: string, workflowIds: string[]) {
    const now = new Date().toISOString();
    this.workflows = this.workflows.map((workflow) =>
      workflow.organizationId === organizationId && workflowIds.includes(workflow.id)
        ? { ...workflow, lastTriggeredAt: now }
        : workflow,
    );
  }
}

const repository = new InMemoryRiskAutomationRepository();

export const riskAutomationService = {
  async getCockpit(organizationId = "org_1"): Promise<RiskCockpitData> {
    const [funnel, alertRules, workflows, recentAlerts] = await Promise.all([
      crmService.getFunnelSummary(organizationId, 3),
      attributionService.listAlertRules(organizationId),
      repository.listWorkflows(organizationId),
      repository.listAlerts(organizationId),
    ]);

    const dealsAtRisk = funnel.dealsAtRisk;
    const revenueAtRisk = dealsAtRisk.reduce((sum, deal) => sum + deal.value, 0);

    const recommendations = [
      dealsAtRisk.length > 0
        ? `Hay ${dealsAtRisk.length} deals en riesgo. Prioriza seguimiento en las próximas 2 horas.`
        : "Sin deals críticos en riesgo ahora mismo.",
      funnel.showUpRate < 40
        ? "El show-up está bajo. Activa recordatorios 24h y 2h antes de llamada."
        : "Show-up rate estable para esta ventana.",
      alertRules.some((rule) => rule.ruleType === "backlog" && rule.enabled)
        ? "Regla de backlog activa: revisa capacidad por setter antes del cierre del día."
        : "Activa regla de backlog para evitar cuello de botella operativo.",
    ];

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        dealsAtRisk: dealsAtRisk.length,
        revenueAtRisk,
        activeRules: alertRules.filter((rule) => rule.enabled).length,
        suggestedActions: dealsAtRisk.length + workflows.filter((wf) => wf.enabled).length,
      },
      dealsAtRisk,
      workflows,
      recentAlerts,
      recommendations,
    };
  },

  async runScan(organizationId = "org_1") {
    const [funnel, workflows] = await Promise.all([crmService.getFunnelSummary(organizationId, 3), repository.listWorkflows(organizationId)]);
    const activeWorkflows = workflows.filter((workflow) => workflow.enabled);

    const generatedAlerts: RiskAlertEvent[] = [];
    const triggeredWorkflowIds = new Set<string>();

    for (const deal of funnel.dealsAtRisk) {
      for (const workflow of activeWorkflows) {
        if (deal.inactiveDays >= workflow.thresholdDays) {
          triggeredWorkflowIds.add(workflow.id);
          generatedAlerts.push({
            id: `risk_alert_${Date.now()}_${deal.dealId}_${workflow.id}`,
            organizationId,
            severity: deal.inactiveDays >= workflow.thresholdDays + 2 ? "high" : "medium",
            title: `Riesgo detectado · ${workflow.name}`,
            detail: `${deal.leadName} (${deal.stage}) lleva ${deal.inactiveDays} días inactivo. Acción: ${workflow.actionLabel}.`,
            dealId: deal.dealId,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    if (triggeredWorkflowIds.size > 0) {
      await Promise.all([
        repository.markTriggered(organizationId, [...triggeredWorkflowIds]),
        automationService.simulateRun({
          organizationId,
          workflowId: "wf_1",
          context: {
            source: "risk_scan",
            triggeredDeals: generatedAlerts.map((event) => event.dealId),
            generatedAlerts: generatedAlerts.length,
          },
        }),
      ]);
    }

    if (generatedAlerts.length > 0) {
      await repository.insertAlerts(generatedAlerts);
    }

    return {
      scannedAt: new Date().toISOString(),
      scannedDeals: funnel.dealsAtRisk.length,
      triggeredWorkflows: triggeredWorkflowIds.size,
      generatedAlerts: generatedAlerts.length,
      alerts: generatedAlerts,
    };
  },

  async toggleWorkflow(organizationId: string, workflowId: string, enabled: boolean) {
    return repository.toggleWorkflow(organizationId, workflowId, enabled);
  },
};
