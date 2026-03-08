import { getPersistenceState } from "@/lib/in-memory-persistence";

export type RiskLevel = "green" | "yellow" | "red";

export interface HealthSummary {
  organizationId: string;
  adoptionScore: number;
  activityScore: number;
  conversionTrend: number;
  riskLevel: RiskLevel;
  generatedAt: string;
}

export interface HealthOrgRecord {
  id: string;
  organizationId: string;
  name: string;
  segment: string;
  adoptionScore: number;
  activityScore: number;
  conversionTrend: number;
  riskLevel: RiskLevel;
  reasons: string[];
  suggestedActions: string[];
  mrrUsd: number;
  lastActivityAt: string;
}

export interface HealthActionLog {
  id: string;
  organizationId: string;
  orgId: string;
  actionLabel: string;
  owner: string;
  note?: string;
  createdAt: string;
}

export interface HealthRepository {
  getSummary(organizationId: string): Promise<HealthSummary>;
  listOrgs(organizationId: string): Promise<HealthOrgRecord[]>;
  logAction(input: { organizationId: string; orgId: string; actionLabel: string; owner: string; note?: string }): Promise<HealthActionLog>;
}

const now = Date.now();

const seedOrgs: HealthOrgRecord[] = [
  {
    id: "tenant_alpha",
    organizationId: "org_1",
    name: "Alpha Dental Group",
    segment: "SMB Salud",
    adoptionScore: 82,
    activityScore: 77,
    conversionTrend: 11,
    riskLevel: "green",
    reasons: ["Pipeline activo con >90% de etapas usadas", "Automatizaciones ejecutándose sin fallos"],
    suggestedActions: ["Proponer upsell de reportes avanzados", "Activar benchmark mensual con equipo de ventas"],
    mrrUsd: 2400,
    lastActivityAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "tenant_beta",
    organizationId: "org_1",
    name: "Beta Legal Studio",
    segment: "Profesionales",
    adoptionScore: 61,
    activityScore: 55,
    conversionTrend: -4,
    riskLevel: "yellow",
    reasons: ["Caída de actividad semanal en inbox", "Alertas SLA sin responsables asignados"],
    suggestedActions: ["Sesión de re-onboarding de 30 min", "Configurar alertas por owner en menos de 24h"],
    mrrUsd: 1800,
    lastActivityAt: new Date(now - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "tenant_gamma",
    organizationId: "org_1",
    name: "Gamma Fitness Chain",
    segment: "Multi-sede",
    adoptionScore: 43,
    activityScore: 39,
    conversionTrend: -17,
    riskLevel: "red",
    reasons: ["Automatizaciones críticas desactivadas", "Tasa de show-up en descenso 3 semanas"],
    suggestedActions: ["Plan de retención con CSM + founder", "Reactivar playbook de no-respuesta esta semana"],
    mrrUsd: 3200,
    lastActivityAt: new Date(now - 42 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "tenant_delta",
    organizationId: "org_1",
    name: "Delta Beauty Academy",
    segment: "Educación",
    adoptionScore: 74,
    activityScore: 70,
    conversionTrend: 6,
    riskLevel: "green",
    reasons: ["Uso alto de canal WhatsApp", "Respuesta media < 12 min"],
    suggestedActions: ["Escalar campañas de remarketing", "Añadir experimento A/B en follow-up"],
    mrrUsd: 2100,
    lastActivityAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
  },
];

class InMemoryHealthRepository implements HealthRepository {
  async getSummary(organizationId: string): Promise<HealthSummary> {
    const orgs = await this.listOrgs(organizationId);
    const avgAdoption = Math.round(orgs.reduce((sum, org) => sum + org.adoptionScore, 0) / orgs.length);
    const avgActivity = Math.round(orgs.reduce((sum, org) => sum + org.activityScore, 0) / orgs.length);
    const avgTrend = Math.round((orgs.reduce((sum, org) => sum + org.conversionTrend, 0) / orgs.length) * 10) / 10;

    const redCount = orgs.filter((org) => org.riskLevel === "red").length;
    const yellowCount = orgs.filter((org) => org.riskLevel === "yellow").length;
    const riskLevel: RiskLevel = redCount > 0 ? "red" : yellowCount > 1 ? "yellow" : "green";

    return {
      organizationId,
      adoptionScore: avgAdoption,
      activityScore: avgActivity,
      conversionTrend: avgTrend,
      riskLevel,
      generatedAt: new Date().toISOString(),
    };
  }

  async listOrgs(organizationId: string): Promise<HealthOrgRecord[]> {
    const state = getPersistenceState();

    if (state.customerHealthSnapshots.length === 0) {
      state.customerHealthSnapshots = structuredClone(seedOrgs);
    }

    return state.customerHealthSnapshots
      .filter((org) => org.organizationId === organizationId)
      .sort((a, b) => {
        const riskOrder = { red: 0, yellow: 1, green: 2 } as const;
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        }
        return +new Date(b.lastActivityAt) - +new Date(a.lastActivityAt);
      })
      .map((item) => structuredClone(item));
  }

  async logAction(input: { organizationId: string; orgId: string; actionLabel: string; owner: string; note?: string }): Promise<HealthActionLog> {
    const state = getPersistenceState();
    const action: HealthActionLog = {
      id: `ha_${Date.now()}`,
      organizationId: input.organizationId,
      orgId: input.orgId,
      actionLabel: input.actionLabel,
      owner: input.owner,
      note: input.note,
      createdAt: new Date().toISOString(),
    };

    state.healthActionsLog = [action, ...state.healthActionsLog];
    return structuredClone(action);
  }
}

const repository: HealthRepository = new InMemoryHealthRepository();

export const healthService = {
  async getSummary(organizationId = "org_1") {
    // TODO(Supabase): aggregate latest health snapshots by organization.
    return repository.getSummary(organizationId);
  },

  async listOrgs(organizationId = "org_1") {
    // TODO(Supabase): query customer health records with pagination.
    return repository.listOrgs(organizationId);
  },

  async logAction(input: { organizationId?: string; orgId: string; actionLabel: string; owner: string; note?: string }) {
    const organizationId = input.organizationId ?? "org_1";
    // TODO(Supabase): persist action log for CSM traceability.
    return repository.logAction({
      organizationId,
      orgId: input.orgId,
      actionLabel: input.actionLabel,
      owner: input.owner,
      note: input.note,
    });
  },
};
