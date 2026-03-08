export type DealStage = "new" | "qualified" | "booked" | "show" | "won" | "lost";

export interface LeadProfile {
  fullName: string;
  email: string;
  phone: string;
  source: string;
  score: number;
  summary: string;
}

export interface DealStageHistoryEvent {
  id: string;
  dealId: string;
  fromStage: DealStage;
  toStage: DealStage;
  changedByUserId: string | null;
  reason: string | null;
  changedAt: string;
  note: string | null;
}

export interface Deal {
  id: string;
  organizationId: string;
  leadId: string;
  leadProfile: LeadProfile;
  ownerId: string;
  ownerName: string;
  stage: DealStage;
  value: number;
  currency: "USD" | "EUR";
  nextStep: string;
  lastActivityAt: string;
  createdAt: string;
  bookedAt?: string | null;
  showAt?: string | null;
  wonAt?: string | null;
  lostAt?: string | null;
  notes: string[];
  objections: string[];
  stageHistory: DealStageHistoryEvent[];
}

export interface UpdateDealStageInput {
  organizationId: string;
  dealId: string;
  nextStage: DealStage;
  changedByUserId?: string;
  reason?: string;
  note?: string;
}

export interface UpsertDealNoteInput {
  organizationId: string;
  dealId: string;
  note: string;
  objections?: string[];
}

export interface ListDealsFilters {
  ownerId?: string;
  stage?: DealStage;
  query?: string;
  fromDate?: string;
  toDate?: string;
}

export interface RevenueByStageItem {
  stage: DealStage;
  label: string;
  totalValue: number;
  deals: number;
}

export interface FunnelSummary {
  totalDeals: number;
  bookingRate: number;
  showUpRate: number;
  closingRate: number;
  funnelVelocityDays: number;
  revenueInPlayTotal: number;
  revenueByStage: RevenueByStageItem[];
  topObjections: { label: string; count: number }[];
  dealsAtRisk: Array<{ dealId: string; leadName: string; ownerName: string; stage: DealStage; inactiveDays: number; value: number; currency: string }>;
}

export interface CrmRepository {
  listDeals(organizationId: string, filters?: ListDealsFilters): Promise<Deal[]>;
  listStageHistory(organizationId: string, dealId: string): Promise<DealStageHistoryEvent[]>;
  updateDealStage(input: UpdateDealStageInput): Promise<Deal | null>;
  upsertDealNote(input: UpsertDealNoteInput): Promise<Deal | null>;
}

const now = Date.now();

const seedDeals: Deal[] = [
  {
    id: "deal_1",
    organizationId: "org_1",
    leadId: "lead_1",
    leadProfile: {
      fullName: "Martina Varela",
      email: "martina@atenea.io",
      phone: "+34 611 200 881",
      source: "Instagram",
      score: 88,
      summary: "Fundadora de marca personal wellness. Quiere escalar a oferta high-ticket con sistema de citas.",
    },
    ownerId: "set_1",
    ownerName: "Nuria",
    stage: "qualified",
    value: 4800,
    currency: "EUR",
    nextStep: "Enviar prework + agendar llamada diagnóstico",
    createdAt: new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    notes: ["Lead responde rápido por IG DM.", "Prefiere cerrar esta semana."],
    objections: ["Precio por encima del presupuesto mensual.", "No tiene setter interno."],
    stageHistory: [],
  },
  {
    id: "deal_2",
    organizationId: "org_1",
    leadId: "lead_2",
    leadProfile: {
      fullName: "Diego Rojas",
      email: "diego@rojasmedia.com",
      phone: "+34 622 999 101",
      source: "WhatsApp",
      score: 72,
      summary: "Creador B2B. Busca llenar agenda con clientes de ticket medio-alto.",
    },
    ownerId: "set_2",
    ownerName: "Aitana",
    stage: "new",
    value: 3200,
    currency: "EUR",
    nextStep: "Calificar timing + autoridad de decisión",
    createdAt: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(now - 86 * 60 * 60 * 1000).toISOString(),
    notes: ["Llega por caso de éxito de YouTube."],
    objections: ["No está seguro del timing."],
    stageHistory: [],
  },
  {
    id: "deal_3",
    organizationId: "org_1",
    leadId: "lead_3",
    leadProfile: {
      fullName: "Sofía Team",
      email: "ops@sofia-team.co",
      phone: "+34 655 331 200",
      source: "Email",
      score: 93,
      summary: "Equipo consolidado. Buscan soporte de ventas + automatización inbound.",
    },
    ownerId: "set_1",
    ownerName: "Nuria",
    stage: "booked",
    value: 9200,
    currency: "EUR",
    nextStep: "Confirmar agenda y enviar deck comercial",
    createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
    bookedAt: new Date(now - 36 * 60 * 60 * 1000).toISOString(),
    notes: ["Reunión agendada para mañana 11:00."],
    objections: ["Duda sobre tiempo de implementación.", "Comparando con otra agencia."],
    stageHistory: [],
  },
  {
    id: "deal_4",
    organizationId: "org_1",
    leadId: "lead_4",
    leadProfile: {
      fullName: "Carlos León",
      email: "carlos@finx.io",
      phone: "+34 611 101 880",
      source: "LinkedIn",
      score: 90,
      summary: "Founder tech con equipo comercial. Quiere optimizar funnel y forecast.",
    },
    ownerId: "set_3",
    ownerName: "Mauro",
    stage: "show",
    value: 12600,
    currency: "EUR",
    nextStep: "Enviar propuesta final",
    createdAt: new Date(now - 21 * 24 * 60 * 60 * 1000).toISOString(),
    bookedAt: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
    showAt: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
    notes: ["Call completada. Decisión en comité el viernes."],
    objections: ["Piden garantía de resultados."],
    stageHistory: [],
  },
];

const initialStageHistory: DealStageHistoryEvent[] = [
  {
    id: "hist_1",
    dealId: "deal_3",
    fromStage: "new",
    toStage: "qualified",
    changedByUserId: "set_1",
    reason: "Lead con presupuesto aprobado",
    changedAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    note: "Lead llegó con recomendación directa.",
  },
  {
    id: "hist_2",
    dealId: "deal_3",
    fromStage: "qualified",
    toStage: "booked",
    changedByUserId: "set_1",
    reason: "Call agendada",
    changedAt: new Date(now - 36 * 60 * 60 * 1000).toISOString(),
    note: "Confirmada por email.",
  },
  {
    id: "hist_3",
    dealId: "deal_4",
    fromStage: "qualified",
    toStage: "booked",
    changedByUserId: "set_3",
    reason: "Match ICP",
    changedAt: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
    note: "Solicita timeline detallado.",
  },
  {
    id: "hist_4",
    dealId: "deal_4",
    fromStage: "booked",
    toStage: "show",
    changedByUserId: "set_3",
    reason: "Asistió al diagnóstico",
    changedAt: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
    note: "Interés alto.",
  },
];

class InMemoryCrmRepository implements CrmRepository {
  private deals = [...seedDeals];
  private stageHistory = [...initialStageHistory];

  constructor() {
    this.syncStageHistory();
  }

  async listDeals(organizationId: string, filters?: ListDealsFilters): Promise<Deal[]> {
    return this.applyFilters(this.deals.filter((deal) => deal.organizationId === organizationId), filters).map(cloneDeal);
  }

  async listStageHistory(organizationId: string, dealId: string): Promise<DealStageHistoryEvent[]> {
    const found = this.deals.find((deal) => deal.id === dealId && deal.organizationId === organizationId);
    if (!found) return [];

    return this.stageHistory
      .filter((entry) => entry.dealId === dealId)
      .sort((a, b) => +new Date(b.changedAt) - +new Date(a.changedAt))
      .map((item) => ({ ...item }));
  }

  async updateDealStage(input: UpdateDealStageInput): Promise<Deal | null> {
    const found = this.deals.find((deal) => deal.id === input.dealId && deal.organizationId === input.organizationId);
    if (!found) return null;

    const previous = found.stage;
    found.stage = input.nextStage;
    found.lastActivityAt = new Date().toISOString();

    if (input.nextStage === "booked") found.bookedAt = found.bookedAt ?? new Date().toISOString();
    if (input.nextStage === "show") found.showAt = found.showAt ?? new Date().toISOString();
    if (input.nextStage === "won") found.wonAt = found.wonAt ?? new Date().toISOString();
    if (input.nextStage === "lost") found.lostAt = found.lostAt ?? new Date().toISOString();

    this.stageHistory.push({
      id: `hist_${Date.now()}`,
      dealId: found.id,
      fromStage: previous,
      toStage: input.nextStage,
      changedByUserId: input.changedByUserId ?? null,
      reason: input.reason ?? null,
      changedAt: new Date().toISOString(),
      note: input.note ?? null,
    });

    this.syncStageHistory();

    return cloneDeal(found);
  }

  async upsertDealNote(input: UpsertDealNoteInput): Promise<Deal | null> {
    const found = this.deals.find((deal) => deal.id === input.dealId && deal.organizationId === input.organizationId);
    if (!found) return null;

    found.notes = [...found.notes, input.note.trim()];
    if (input.objections) {
      found.objections = input.objections.filter((item) => item.trim().length > 0).map((item) => item.trim());
    }
    found.lastActivityAt = new Date().toISOString();

    return cloneDeal(found);
  }

  private applyFilters(deals: Deal[], filters?: ListDealsFilters): Deal[] {
    if (!filters) return deals;

    return deals.filter((deal) => {
      if (filters.ownerId && deal.ownerId !== filters.ownerId) return false;
      if (filters.stage && deal.stage !== filters.stage) return false;

      if (filters.query) {
        const query = filters.query.toLowerCase();
        const bucket = `${deal.leadProfile.fullName} ${deal.leadProfile.email} ${deal.ownerName}`.toLowerCase();
        if (!bucket.includes(query)) return false;
      }

      if (filters.fromDate && +new Date(deal.createdAt) < +new Date(filters.fromDate)) return false;
      if (filters.toDate && +new Date(deal.createdAt) > +new Date(filters.toDate)) return false;

      return true;
    });
  }

  private syncStageHistory() {
    this.deals = this.deals.map((deal) => ({
      ...deal,
      stageHistory: this.stageHistory
        .filter((entry) => entry.dealId === deal.id)
        .sort((a, b) => +new Date(b.changedAt) - +new Date(a.changedAt))
        .map((item) => ({ ...item })),
    }));
  }
}

function cloneDeal(deal: Deal): Deal {
  return {
    ...deal,
    leadProfile: { ...deal.leadProfile },
    notes: [...deal.notes],
    objections: [...deal.objections],
    stageHistory: deal.stageHistory.map((entry) => ({ ...entry })),
  };
}

function rate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function getDaysDiff(fromISO: string, toISO: string): number {
  const diff = +new Date(toISO) - +new Date(fromISO);
  return Math.max(0, Math.round(diff / (24 * 60 * 60 * 1000)));
}

const repository: CrmRepository = new InMemoryCrmRepository();

export const crmService = {
  async listDeals(organizationId = "org_1", filters?: ListDealsFilters): Promise<Deal[]> {
    // TODO(Supabase): replace repository with Postgres-backed implementation using `public.deals` + `public.leads`.
    return repository.listDeals(organizationId, filters);
  },

  async listDealStageHistory(organizationId: string, dealId: string): Promise<DealStageHistoryEvent[]> {
    // TODO(Supabase): query `public.deal_stage_history` ordered by changed_at desc.
    return repository.listStageHistory(organizationId, dealId);
  },

  async updateDealStage(input: UpdateDealStageInput): Promise<Deal | null> {
    // TODO(Supabase): persist stage transition and append to `public.deal_stage_history` in one transaction.
    return repository.updateDealStage(input);
  },

  async upsertDealNote(input: UpsertDealNoteInput): Promise<Deal | null> {
    // TODO(Supabase): persist notes/objections in `public.deal_notes` or `public.deal_objections` tables.
    return repository.upsertDealNote(input);
  },

  async getFunnelSummary(organizationId = "org_1", atRiskDays = 5): Promise<FunnelSummary> {
    const deals = await repository.listDeals(organizationId);
    const booked = deals.filter((deal) => ["booked", "show", "won"].includes(deal.stage));
    const showed = deals.filter((deal) => ["show", "won"].includes(deal.stage));
    const won = deals.filter((deal) => deal.stage === "won");

    const velocityPopulation = deals
      .filter((deal) => deal.createdAt && (deal.wonAt || deal.lostAt || deal.showAt || deal.bookedAt))
      .map((deal) => getDaysDiff(deal.createdAt, deal.wonAt || deal.lostAt || deal.showAt || deal.bookedAt || new Date().toISOString()));

    const funnelVelocityDays =
      velocityPopulation.length > 0
        ? Number((velocityPopulation.reduce((sum, value) => sum + value, 0) / velocityPopulation.length).toFixed(1))
        : 0;

    const revenueByStage = (["new", "qualified", "booked", "show", "won", "lost"] as DealStage[]).map((stage) => {
      const scoped = deals.filter((deal) => deal.stage === stage);
      return {
        stage,
        label: crmStageLabels[stage],
        totalValue: scoped.reduce((sum, deal) => sum + deal.value, 0),
        deals: scoped.length,
      };
    });

    const objectionCounts = new Map<string, number>();
    deals.forEach((deal) => {
      deal.objections.forEach((objection) => {
        objectionCounts.set(objection, (objectionCounts.get(objection) ?? 0) + 1);
      });
    });

    const topObjections = [...objectionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));

    const dealsAtRisk = deals
      .map((deal) => ({
        dealId: deal.id,
        leadName: deal.leadProfile.fullName,
        ownerName: deal.ownerName,
        stage: deal.stage,
        inactiveDays: getDaysDiff(deal.lastActivityAt, new Date().toISOString()),
        value: deal.value,
        currency: deal.currency,
      }))
      .filter((deal) => deal.inactiveDays > atRiskDays && !["won", "lost"].includes(deal.stage))
      .sort((a, b) => b.inactiveDays - a.inactiveDays);

    return {
      totalDeals: deals.length,
      bookingRate: rate(booked.length, deals.length),
      showUpRate: rate(showed.length, booked.length),
      closingRate: rate(won.length, showed.length),
      funnelVelocityDays,
      revenueInPlayTotal: deals.filter((deal) => !["won", "lost"].includes(deal.stage)).reduce((sum, deal) => sum + deal.value, 0),
      revenueByStage,
      topObjections,
      dealsAtRisk,
    };
  },
};

export const crmStageLabels: Record<DealStage, string> = {
  new: "Nuevo",
  qualified: "Calificado",
  booked: "Booked",
  show: "Show",
  won: "Ganado",
  lost: "Perdido",
};