import { getPersistenceState, type AlertConfigStore, type ContentAttributionStore, type ContentPieceStore, type ReportSnapshotStore } from "@/lib/in-memory-persistence";

export type ContentPlatform = "instagram" | "youtube" | "tiktok" | "linkedin" | "x";
export type ContentType = "reel" | "post" | "story" | "video" | "thread" | "newsletter";

export interface ContentPiece {
  id: string;
  organizationId: string;
  platform: ContentPlatform;
  type: ContentType;
  hook: string;
  angle: string;
  publishedAt: string;
}

export interface ContentAttribution {
  id: string;
  organizationId: string;
  leadId: string;
  contentPieceId: string;
  callBooked: boolean;
  dealWon: boolean;
  attributedRevenue: number;
  createdAt: string;
}

export interface ContentPieceMetrics {
  piece: ContentPiece;
  leadsGenerated: number;
  callsBooked: number;
  dealsWon: number;
  attributedRevenue: number;
  revenuePerPiece: number;
}

export interface AttributionSummary {
  totals: {
    leadsGenerated: number;
    callsBooked: number;
    dealsWon: number;
    attributedRevenue: number;
  };
  topHooks: Array<{ hook: string; angle: string; leads: number; dealsWon: number; attributedRevenue: number }>;
  revenueByPiece: Array<{ contentPieceId: string; hook: string; platform: ContentPlatform; attributedRevenue: number; leadsGenerated: number }>;
}

export interface LinkLeadToContentInput {
  organizationId: string;
  leadId: string;
  contentPieceId: string;
  callBooked?: boolean;
  dealWon?: boolean;
  attributedRevenue?: number;
}

export interface AttributionExplainResult {
  leadId: string;
  matchedContentPieceId: string | null;
  score: number;
  reasons: Array<{ rule: string; weight: number; matched: boolean; detail: string }>;
}

export interface AlertRule {
  id: string;
  organizationId: string;
  ruleType: "vip_no_response" | "show_up_drop" | "inbound_spike" | "backlog";
  enabled: boolean;
  threshold: number;
  window: "1h" | "24h" | "7d";
  createdAt: string;
  updatedAt: string;
}

export interface DailyDigestPreview {
  date: string;
  generatedAt: string;
  summary: string;
  highlights: string[];
  kpis: {
    leads: number;
    callsBooked: number;
    dealsWon: number;
    attributedRevenue: number;
  };
}

export interface WeeklyReviewPreview {
  weekLabel: string;
  generatedAt: string;
  summary: string;
  wins: string[];
  risks: string[];
  kpis: {
    leads: number;
    callsBooked: number;
    dealsWon: number;
    attributedRevenue: number;
  };
}

const seedPieces: ContentPieceStore[] = [
  { id: "cp_1", organizationId: "org_1", platform: "instagram", type: "reel", hook: "Cómo cerrar 5 clientes premium en 30 días", angle: "proof", publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "cp_2", organizationId: "org_1", platform: "youtube", type: "video", hook: "3 errores que matan tu show-up rate", angle: "pain", publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "cp_3", organizationId: "org_1", platform: "linkedin", type: "post", hook: "El playbook para pasar de DM a call booked", angle: "framework", publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "cp_4", organizationId: "org_1", platform: "tiktok", type: "video", hook: "No escales ads sin este filtro", angle: "contrarian", publishedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "cp_5", organizationId: "org_1", platform: "x", type: "thread", hook: "7 mensajes para revivir leads fríos", angle: "tactical", publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
];

const seedAttributions: ContentAttributionStore[] = [
  { id: "ca_1", organizationId: "org_1", leadId: "lead_1", contentPieceId: "cp_1", callBooked: true, dealWon: false, attributedRevenue: 0, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "ca_2", organizationId: "org_1", leadId: "lead_2", contentPieceId: "cp_2", callBooked: true, dealWon: true, attributedRevenue: 3200, createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "ca_3", organizationId: "org_1", leadId: "lead_3", contentPieceId: "cp_1", callBooked: true, dealWon: true, attributedRevenue: 9200, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "ca_4", organizationId: "org_1", leadId: "lead_4", contentPieceId: "cp_3", callBooked: true, dealWon: false, attributedRevenue: 0, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "ca_5", organizationId: "org_1", leadId: "lead_5", contentPieceId: "cp_5", callBooked: false, dealWon: false, attributedRevenue: 0, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
];

const seedAlerts: AlertConfigStore[] = [
  { id: "alert_1", organizationId: "org_1", ruleType: "vip_no_response", enabled: true, threshold: 20, window: "1h", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "alert_2", organizationId: "org_1", ruleType: "show_up_drop", enabled: true, threshold: 15, window: "7d", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "alert_3", organizationId: "org_1", ruleType: "inbound_spike", enabled: false, threshold: 35, window: "24h", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "alert_4", organizationId: "org_1", ruleType: "backlog", enabled: true, threshold: 30, window: "24h", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const seedLeadDmSignals: Record<string, string> = {
  lead_1: "vi el reel de 5 clientes premium y quiero mas info",
  lead_2: "el video de show up rate me hizo escribirte",
  lead_3: "llegue por instagram por el caso de cierre premium",
  lead_4: "me ayudo el playbook de dm a call booked",
  lead_5: "vengo del thread de mensajes para leads frios",
};

const seedSnapshots: ReportSnapshotStore[] = [
  {
    id: "report_daily_1",
    organizationId: "org_1",
    reportType: "daily_digest",
    periodLabel: new Date().toISOString().slice(0, 10),
    payload: {
      summary: "Pipeline estable y mejora en velocidad de respuesta.",
      highlights: ["+18 leads inbound", "Show-up rate +6pp", "2 deals won en 24h"],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "report_weekly_1",
    organizationId: "org_1",
    reportType: "weekly_review",
    periodLabel: "Semana actual",
    payload: {
      summary: "Semana sólida: hooks de prueba social lideran revenue.",
      wins: ["Hook '5 clientes premium' top #1", "SLA medio 8m", "CAC estable"],
      risks: ["Backlog sube en WhatsApp", "Aitana >85% capacidad"],
    },
    createdAt: new Date().toISOString(),
  },
];

interface AttributionRepository {
  listContent(organizationId: string): Promise<ContentPiece[]>;
  listAttributions(organizationId: string): Promise<ContentAttribution[]>;
  linkLead(input: LinkLeadToContentInput): Promise<ContentAttribution | null>;
  listAlerts(organizationId: string): Promise<AlertRule[]>;
  upsertAlert(rule: Omit<AlertRule, "createdAt" | "updatedAt">): Promise<AlertRule>;
  getDailySnapshot(organizationId: string): Promise<ReportSnapshotStore | null>;
  getWeeklySnapshot(organizationId: string): Promise<ReportSnapshotStore | null>;
}

class InMemoryAttributionRepository implements AttributionRepository {
  private state = getPersistenceState();

  constructor() {
    if (this.state.contentPieces.length === 0) this.state.contentPieces.push(...seedPieces);
    if (this.state.contentAttributions.length === 0) this.state.contentAttributions.push(...seedAttributions);
    if (this.state.alertConfigs.length === 0) this.state.alertConfigs.push(...seedAlerts);
    if (this.state.reportSnapshots.length === 0) this.state.reportSnapshots.push(...seedSnapshots);
  }

  async listContent(organizationId: string): Promise<ContentPiece[]> {
    return this.state.contentPieces.filter((piece) => piece.organizationId === organizationId).map((piece) => ({ ...piece }));
  }

  async listAttributions(organizationId: string): Promise<ContentAttribution[]> {
    return this.state.contentAttributions.filter((item) => item.organizationId === organizationId).map((item) => ({ ...item }));
  }

  async linkLead(input: LinkLeadToContentInput): Promise<ContentAttribution | null> {
    const pieceExists = this.state.contentPieces.some((piece) => piece.id === input.contentPieceId && piece.organizationId === input.organizationId);
    if (!pieceExists) return null;

    const record: ContentAttributionStore = {
      id: `ca_${Date.now()}`,
      organizationId: input.organizationId,
      leadId: input.leadId,
      contentPieceId: input.contentPieceId,
      callBooked: Boolean(input.callBooked),
      dealWon: Boolean(input.dealWon),
      attributedRevenue: Math.max(0, Number(input.attributedRevenue ?? 0)),
      createdAt: new Date().toISOString(),
    };

    this.state.contentAttributions.push(record);
    return { ...record };
  }

  async listAlerts(organizationId: string): Promise<AlertRule[]> {
    return this.state.alertConfigs.filter((rule) => rule.organizationId === organizationId).map((rule) => ({ ...rule }));
  }

  async upsertAlert(rule: Omit<AlertRule, "createdAt" | "updatedAt">): Promise<AlertRule> {
    const existing = this.state.alertConfigs.find((item) => item.organizationId === rule.organizationId && item.ruleType === rule.ruleType);
    const now = new Date().toISOString();

    if (existing) {
      existing.enabled = rule.enabled;
      existing.threshold = rule.threshold;
      existing.window = rule.window;
      existing.updatedAt = now;
      return { ...existing };
    }

    const created: AlertConfigStore = { ...rule, createdAt: now, updatedAt: now };
    this.state.alertConfigs.push(created);
    return { ...created };
  }

  async getDailySnapshot(organizationId: string): Promise<ReportSnapshotStore | null> {
    return this.state.reportSnapshots.find((item) => item.organizationId === organizationId && item.reportType === "daily_digest") ?? null;
  }

  async getWeeklySnapshot(organizationId: string): Promise<ReportSnapshotStore | null> {
    return this.state.reportSnapshots.find((item) => item.organizationId === organizationId && item.reportType === "weekly_review") ?? null;
  }
}

const repository: AttributionRepository = new InMemoryAttributionRepository();

function round(n: number) {
  return Number(n.toFixed(2));
}

function normalizeText(input: string): string[] {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function deterministicMatchScore(dmSignal: string, piece: ContentPiece): AttributionExplainResult["reasons"] {
  const dmTokens = new Set(normalizeText(dmSignal));
  const hookTokens = normalizeText(piece.hook);
  const angleTokens = normalizeText(piece.angle);
  const overlap = hookTokens.filter((t) => dmTokens.has(t));
  const hookHit = overlap.length > 0;
  const angleHit = angleTokens.some((t) => dmTokens.has(t));
  const platformHint = (piece.platform === "instagram" && dmTokens.has("instagram")) || (piece.platform === "x" && dmTokens.has("thread"));

  return [
    { rule: "hook_keyword_overlap", weight: Math.min(70, overlap.length * 20), matched: hookHit, detail: hookHit ? `keywords: ${overlap.join(", ")}` : "sin overlap" },
    { rule: "angle_keyword_match", weight: angleHit ? 20 : 0, matched: angleHit, detail: angleHit ? "angle mencionado en DM" : "angle no detectado" },
    { rule: "platform_hint", weight: platformHint ? 10 : 0, matched: platformHint, detail: platformHint ? "señal de plataforma consistente" : "sin señal de plataforma" },
  ];
}

export const attributionService = {
  async listContentMetrics(organizationId = "org_1"): Promise<ContentPieceMetrics[]> {
    const [pieces, attributions] = await Promise.all([repository.listContent(organizationId), repository.listAttributions(organizationId)]);

    return pieces
      .map((piece) => {
        const scoped = attributions.filter((item) => item.contentPieceId === piece.id);
        const attributedRevenue = scoped.reduce((sum, item) => sum + item.attributedRevenue, 0);
        return {
          piece,
          leadsGenerated: scoped.length,
          callsBooked: scoped.filter((item) => item.callBooked).length,
          dealsWon: scoped.filter((item) => item.dealWon).length,
          attributedRevenue: round(attributedRevenue),
          revenuePerPiece: round(scoped.length ? attributedRevenue / scoped.length : 0),
        };
      })
      .sort((a, b) => +new Date(b.piece.publishedAt) - +new Date(a.piece.publishedAt));
  },

  async getSummary(organizationId = "org_1"): Promise<AttributionSummary> {
    const metrics = await this.listContentMetrics(organizationId);

    return {
      totals: {
        leadsGenerated: metrics.reduce((sum, item) => sum + item.leadsGenerated, 0),
        callsBooked: metrics.reduce((sum, item) => sum + item.callsBooked, 0),
        dealsWon: metrics.reduce((sum, item) => sum + item.dealsWon, 0),
        attributedRevenue: round(metrics.reduce((sum, item) => sum + item.attributedRevenue, 0)),
      },
      topHooks: [...metrics]
        .sort((a, b) => b.attributedRevenue - a.attributedRevenue || b.dealsWon - a.dealsWon)
        .slice(0, 5)
        .map((item) => ({
          hook: item.piece.hook,
          angle: item.piece.angle,
          leads: item.leadsGenerated,
          dealsWon: item.dealsWon,
          attributedRevenue: item.attributedRevenue,
        })),
      revenueByPiece: metrics
        .map((item) => ({
          contentPieceId: item.piece.id,
          hook: item.piece.hook,
          platform: item.piece.platform,
          attributedRevenue: item.attributedRevenue,
          leadsGenerated: item.leadsGenerated,
        }))
        .sort((a, b) => b.attributedRevenue - a.attributedRevenue),
    };
  },

  async linkLeadToContent(input: LinkLeadToContentInput) {
    return repository.linkLead(input);
  },

  async getDailyPreview(organizationId = "org_1"): Promise<DailyDigestPreview> {
    const [summary, snapshot] = await Promise.all([this.getSummary(organizationId), repository.getDailySnapshot(organizationId)]);
    const payload = snapshot?.payload as { summary?: string; highlights?: string[] } | undefined;

    return {
      date: new Date().toISOString().slice(0, 10),
      generatedAt: new Date().toISOString(),
      summary: payload?.summary ?? "Sin snapshot persistido. Se muestra vista previa con datos actuales.",
      highlights: payload?.highlights ?? ["Sin highlights persistidos"],
      kpis: {
        leads: summary.totals.leadsGenerated,
        callsBooked: summary.totals.callsBooked,
        dealsWon: summary.totals.dealsWon,
        attributedRevenue: summary.totals.attributedRevenue,
      },
    };
  },

  async getWeeklyPreview(organizationId = "org_1"): Promise<WeeklyReviewPreview> {
    const [summary, snapshot] = await Promise.all([this.getSummary(organizationId), repository.getWeeklySnapshot(organizationId)]);
    const payload = snapshot?.payload as { summary?: string; wins?: string[]; risks?: string[] } | undefined;

    return {
      weekLabel: "Semana en curso",
      generatedAt: new Date().toISOString(),
      summary: payload?.summary ?? "Weekly snapshot no persistido todavía.",
      wins: payload?.wins ?? ["Sin wins persistidos"],
      risks: payload?.risks ?? ["Sin riesgos persistidos"],
      kpis: {
        leads: summary.totals.leadsGenerated,
        callsBooked: summary.totals.callsBooked,
        dealsWon: summary.totals.dealsWon,
        attributedRevenue: summary.totals.attributedRevenue,
      },
    };
  },

  async listAlertRules(organizationId = "org_1") {
    return repository.listAlerts(organizationId);
  },

  async upsertAlertRule(input: Omit<AlertRule, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
    return repository.upsertAlert({
      id: input.id ?? `alert_${Date.now()}`,
      organizationId: input.organizationId,
      ruleType: input.ruleType,
      enabled: input.enabled,
      threshold: input.threshold,
      window: input.window,
    });
  },

  async explainLeadAttribution(leadId: string, organizationId = "org_1"): Promise<AttributionExplainResult> {
    const dmSignal = seedLeadDmSignals[leadId] ?? "";
    const pieces = await repository.listContent(organizationId);
    if (!dmSignal || pieces.length === 0) {
      return { leadId, matchedContentPieceId: null, score: 0, reasons: [{ rule: "no_signal", weight: 0, matched: false, detail: "No hay señal DM para este lead" }] };
    }

    const scored = pieces.map((piece) => {
      const reasons = deterministicMatchScore(dmSignal, piece);
      const score = reasons.reduce((sum, r) => sum + r.weight, 0);
      return { pieceId: piece.id, reasons, score };
    });

    const best = scored.sort((a, b) => b.score - a.score || a.pieceId.localeCompare(b.pieceId))[0];
    return { leadId, matchedContentPieceId: best?.pieceId ?? null, score: best?.score ?? 0, reasons: best?.reasons ?? [] };
  },
};
