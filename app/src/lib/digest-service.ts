import { attributionService } from "@/lib/attribution-service";
import { crmService } from "@/lib/crm-service";
import { hoyService } from "@/lib/hoy-service";
import { inboxService } from "@/lib/inbox-service";
import { getPersistenceState, type ReportSnapshotStore } from "@/lib/in-memory-persistence";
import { riskAutomationService } from "@/lib/risk-automation-service";

export type DigestType = "daily" | "weekly";

export interface DigestRun {
  id: string;
  organizationId: string;
  digestType: DigestType;
  status: "completed" | "failed";
  summary: string;
  body: string;
  deliveryStatus: "not_sent" | "queued";
  generatedAt: string;
}

const runs: DigestRun[] = [];
const scheduleByOrg = new Map<string, { dailyAt: string; weeklyAt: string }>();

function formatEUR(n: number) {
  return `€${n.toLocaleString("es-ES")}`;
}

async function buildPayload(organizationId: string) {
  const [hoy, crm, inbox, risk, attribution] = await Promise.all([
    hoyService.getSummary(organizationId),
    crmService.getFunnelSummary(organizationId, 4),
    inboxService.listConversations(),
    riskAutomationService.getCockpit(organizationId),
    attributionService.getSummary(organizationId),
  ]);

  return { hoy, crm, inbox, risk, attribution };
}

function dailyTemplate(data: Awaited<ReturnType<typeof buildPayload>>) {
  const urgent = data.hoy.inboxUrgentQueue.slice(0, 3);
  const risks = data.crm.dealsAtRisk.slice(0, 3);
  const summary = `Inbox urgente ${urgent.length}, deals en riesgo ${risks.length}, revenue en juego ${formatEUR(data.crm.revenueInPlayTotal)}.`;
  const body = [
    "# Digest Diario · Operación Comercial",
    "",
    `Resumen: ${summary}`,
    "",
    "## Qué mover hoy",
    ...urgent.map((item, idx) => `${idx + 1}. Responder a ${item.leadName} (${item.channel}) · ${item.dueLabel}.`),
    ...risks.map((deal, idx) => `${idx + 1 + urgent.length}. Rescatar deal ${deal.leadName} (${deal.inactiveDays} días inactivo, ${formatEUR(deal.value)}).`),
    "",
    "## Señales",
    `- Show-up rate: ${data.crm.showUpRate}%`,
    `- Closing rate: ${data.crm.closingRate}%`,
    `- Riesgos activos: ${data.risk.totals.dealsAtRisk}`,
    `- Revenue atribuido contenido: ${formatEUR(data.attribution.totals.attributedRevenue)}`,
  ].join("\n");

  return { summary, body };
}

function weeklyTemplate(data: Awaited<ReturnType<typeof buildPayload>>) {
  const topHooks = data.attribution.topHooks.slice(0, 3).map((h) => `${h.hook} (${formatEUR(h.attributedRevenue)})`);
  const summary = `Semana: ${data.attribution.totals.leadsGenerated} leads, ${data.attribution.totals.dealsWon} deals won, ${formatEUR(data.attribution.totals.attributedRevenue)} atribuidos.`;
  const body = [
    "# Digest Semanal · Dirección",
    "",
    `Resumen ejecutivo: ${summary}`,
    "",
    "## Victorias",
    `- Booking rate: ${data.crm.bookingRate}%`,
    `- Show-up rate: ${data.crm.showUpRate}%`,
    `- Closing rate: ${data.crm.closingRate}%`,
    ...topHooks.map((hook) => `- Hook top: ${hook}`),
    "",
    "## Riesgos y foco",
    ...data.risk.recommendations.slice(0, 3).map((r) => `- ${r}`),
    `- Backlog inbox total: ${data.inbox.filter((item) => item.hasNoReply).length} conversaciones sin reply.`,
  ].join("\n");

  return { summary, body };
}

function persistSnapshot(organizationId: string, digestType: DigestType, summary: string, body: string) {
  const state = getPersistenceState();
  const snapshot: ReportSnapshotStore = {
    id: `digest_snapshot_${Date.now()}`,
    organizationId,
    reportType: digestType === "daily" ? "daily_digest" : "weekly_review",
    periodLabel: digestType === "daily" ? new Date().toISOString().slice(0, 10) : `W${new Date().getUTCDate()}`,
    payload: { summary, body },
    createdAt: new Date().toISOString(),
  };

  state.reportSnapshots.unshift(snapshot);
}

export const digestService = {
  async preview(organizationId: string, digestType: DigestType) {
    const payload = await buildPayload(organizationId);
    return digestType === "daily" ? dailyTemplate(payload) : weeklyTemplate(payload);
  },

  async run(organizationId: string, digestType: DigestType): Promise<DigestRun> {
    const generated = await this.preview(organizationId, digestType);
    const run: DigestRun = {
      id: `digest_run_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      organizationId,
      digestType,
      status: "completed",
      summary: generated.summary,
      body: generated.body,
      deliveryStatus: "queued",
      generatedAt: new Date().toISOString(),
    };

    runs.unshift(run);
    persistSnapshot(organizationId, digestType, generated.summary, generated.body);
    return run;
  },

  listRuns(organizationId: string) {
    return runs.filter((run) => run.organizationId === organizationId).slice(0, 50);
  },

  getLastRun(organizationId: string) {
    return runs.find((run) => run.organizationId === organizationId) ?? null;
  },

  getSchedule(organizationId: string) {
    if (!scheduleByOrg.has(organizationId)) {
      scheduleByOrg.set(organizationId, { dailyAt: "08:00", weeklyAt: "Lunes 08:15" });
    }
    return scheduleByOrg.get(organizationId)!;
  },
};
