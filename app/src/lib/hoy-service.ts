import { automationService } from "@/lib/automation-service";
import { attributionService } from "@/lib/attribution-service";
import { crmService } from "@/lib/crm-service";
import { healthService } from "@/lib/health-service";
import { inboxService } from "@/lib/inbox-service";
import { getPersistenceState } from "@/lib/in-memory-persistence";
import { revenueBridgeService } from "@/lib/revenue-bridge-service";
import { ensureWebhookSeed, getWebhookMetrics, listWebhookEvents } from "@/lib/webhook-engine";

export interface HoyTask {
  id: string;
  title: string;
  detail: string;
  priority: "alta" | "media";
  href: string;
}

export interface HoySummary {
  generatedAt: string;
  priorities: HoyTask[];
  inboxUrgentQueue: Array<{
    conversationId: string;
    leadName: string;
    channel: string;
    slaBreached: boolean;
    dueLabel: string;
    preview: string;
    ownerName: string;
  }>;
  dealsAtRisk: Array<{
    dealId: string;
    leadName: string;
    ownerName: string;
    stage: string;
    inactiveDays: number;
    value: number;
    currency: string;
  }>;
  automationStatus: {
    activeWorkflows: number;
    pausedWorkflows: number;
    lastExecutionSummary: string;
    experimentsRunning: number;
    experimentsDraft: number;
  };
  topAlerts: Array<{
    id: string;
    level: "critica" | "aviso";
    title: string;
    detail: string;
  }>;
  quickActions: Array<{ id: string; label: string; href: string }>;
  revenueBridge: ReturnType<typeof revenueBridgeService.getOperationalSnapshot>;
}

function minutesUntil(iso?: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

function dueLabel(slaDueAt?: string | null) {
  if (!slaDueAt) return "Sin SLA";
  const delta = minutesUntil(slaDueAt);
  if (delta < 0) return `SLA vencido hace ${Math.abs(delta)}m`;
  return `SLA en ${delta}m`;
}

export const hoyService = {
  async getSummary(organizationId = "org_1"): Promise<HoySummary> {
    await ensureWebhookSeed();

    const [conversations, funnel, automations, automationLogs, healthSummary, riskyOrgs, alertRules] = await Promise.all([
      inboxService.listConversations(),
      crmService.getFunnelSummary(organizationId, 4),
      automationService.list(organizationId),
      automationService.listExecutionLogs(organizationId),
      healthService.getSummary(organizationId),
      healthService.listOrgs(organizationId),
      attributionService.listAlertRules(organizationId),
    ]);

    const webhookMetrics = getWebhookMetrics();
    const retryingEvents = listWebhookEvents({ status: "retrying" }).length;
    const revenueBridge = revenueBridgeService.getOperationalSnapshot();

    const inboxUrgentQueue = conversations
      .filter((item) => item.slaBreached || minutesUntil(item.slaDueAt) <= 30)
      .sort((a, b) => minutesUntil(a.slaDueAt) - minutesUntil(b.slaDueAt))
      .slice(0, 6)
      .map((item) => ({
        conversationId: item.id,
        leadName: item.leadName,
        channel: item.channel,
        slaBreached: item.slaBreached,
        dueLabel: dueLabel(item.slaDueAt),
        preview: item.preview,
        ownerName: item.ownerName ?? item.assignedSetterName ?? "Sin owner",
      }));

    const priorities: HoyTask[] = [
      ...(inboxUrgentQueue.slice(0, 2).map((item) => ({
        id: `sla_${item.conversationId}`,
        title: `Responder a ${item.leadName}`,
        detail: `${item.dueLabel} · ${item.channel.toUpperCase()} · Owner ${item.ownerName}`,
        priority: "alta" as const,
        href: "/inbox",
      })) ?? []),
      ...funnel.dealsAtRisk.slice(0, 2).map((deal) => ({
        id: `risk_${deal.dealId}`,
        title: `Rescatar deal ${deal.leadName}`,
        detail: `${deal.stage} · ${deal.inactiveDays} días sin actividad · €${deal.value.toLocaleString("es-ES")}`,
        priority: "alta" as const,
        href: "/crm",
      })),
      {
        id: "automation_review",
        title: "Revisar workflows pausados",
        detail: `${automations.filter((workflow) => !workflow.active).length} workflow(s) pausados en cola de revisión`,
        priority: "media" as const,
        href: "/automations",
      },
    ].slice(0, 5);

    const db = getPersistenceState();
    const experiments = db.experiments.filter((item) => item.organizationId === organizationId);

    const topAlerts: HoySummary["topAlerts"] = [];
    if (funnel.dealsAtRisk.length > 0) {
      topAlerts.push({
        id: "risk_pipeline",
        level: "critica",
        title: "Pipeline con deals fríos",
        detail: `${funnel.dealsAtRisk.length} deal(s) en riesgo · €${funnel.dealsAtRisk.reduce((sum, d) => sum + d.value, 0).toLocaleString("es-ES")} en juego`,
      });
    }

    if (webhookMetrics.deadLetterCount > 0 || retryingEvents > 0) {
      topAlerts.push({
        id: "webhooks_ops",
        level: "aviso",
        title: "Webhooks con backlog operativo",
        detail: `${retryingEvents} en retry · ${webhookMetrics.deadLetterCount} en dead-letter`,
      });
    }

    if (healthSummary.riskLevel !== "green") {
      topAlerts.push({
        id: "health_watch",
        level: "aviso",
        title: "Health score requiere seguimiento",
        detail: `Nivel ${healthSummary.riskLevel.toUpperCase()} · adopción ${healthSummary.adoptionScore}% · actividad ${healthSummary.activityScore}%`,
      });
    }

    const criticalOrg = riskyOrgs.find((org) => org.riskLevel === "red");
    if (criticalOrg) {
      topAlerts.push({
        id: `org_${criticalOrg.id}`,
        level: "critica",
        title: `${criticalOrg.name} en riesgo de churn`,
        detail: `${criticalOrg.reasons[0] ?? "Sin motivo cargado"}`,
      });
    }

    if (alertRules.some((rule) => !rule.enabled)) {
      topAlerts.push({
        id: "alerts_disabled",
        level: "aviso",
        title: "Reglas de alerta desactivadas",
        detail: `${alertRules.filter((rule) => !rule.enabled).length} regla(s) sin cobertura activa`,
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      priorities,
      inboxUrgentQueue,
      dealsAtRisk: funnel.dealsAtRisk.slice(0, 6),
      automationStatus: {
        activeWorkflows: automations.filter((workflow) => workflow.active).length,
        pausedWorkflows: automations.filter((workflow) => !workflow.active).length,
        lastExecutionSummary: automationLogs[0]?.summary ?? "Sin ejecuciones hoy",
        experimentsRunning: experiments.filter((item) => item.state === "running").length,
        experimentsDraft: experiments.filter((item) => item.state === "draft").length,
      },
      topAlerts: topAlerts.slice(0, 5),
      quickActions: [
        { id: "qa1", label: "Abrir Inbox urgente", href: "/inbox" },
        { id: "qa2", label: "Revisar deals en riesgo", href: "/crm" },
        { id: "qa3", label: "Activar automations", href: "/automations" },
        { id: "qa4", label: "Monitorear webhooks", href: "/webhooks" },
        { id: "qa5", label: "Ejecutar checklist QA", href: "/qa" },
      ],
      revenueBridge,
    };
  },
};
