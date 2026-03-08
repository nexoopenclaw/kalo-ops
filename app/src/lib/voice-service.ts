import { createHash, randomUUID } from "node:crypto";

export type VoiceConsentStatus = "granted" | "revoked";

export interface VoiceConsentInput {
  organizationId: string;
  actorUserId: string;
  leadId: string;
  voiceCloneAllowed: boolean;
  reason?: string;
}

export interface VoiceConsentRecord {
  id: string;
  organizationId: string;
  actorUserId: string;
  leadId: string;
  status: VoiceConsentStatus;
  reason?: string;
  createdAt: string;
}

export interface VoicePreviewInput {
  organizationId: string;
  actorUserId: string;
  voiceModelId: string;
  sourceText: string;
}

export interface VoicePreviewResult {
  previewId: string;
  script: string;
  sourceTextHash: string;
  provider: "mock" | "elevenlabs";
  modelId: string;
  state: "queued" | "generating" | "ready";
  audioUrl?: string;
  generatedAt?: string;
}

export interface SendVoiceNoteInput {
  organizationId: string;
  actorUserId: string;
  leadId: string;
  conversationId?: string;
  voiceModelId: string;
  sourceText: string;
  previewId?: string;
}

export interface VoiceAuditLog {
  id: string;
  organizationId: string;
  actorUserId: string;
  leadId: string;
  conversationId?: string;
  voiceModelId: string;
  sourceTextHash: string;
  previewId?: string;
  status: "sent" | "failed";
  createdAt: string;
}

export interface ExperimentVariantInput {
  openerTemplate: string;
  followupTemplate: string;
}

export interface CreateExperimentInput {
  organizationId: string;
  actorUserId: string;
  name: string;
  trafficSplitA: number;
  variantA: ExperimentVariantInput;
  variantB: ExperimentVariantInput;
}

export interface ExperimentRecord {
  id: string;
  organizationId: string;
  actorUserId: string;
  name: string;
  trafficSplitA: number;
  variantA: ExperimentVariantInput;
  variantB: ExperimentVariantInput;
  createdAt: string;
}

export interface RecordOutcomeInput {
  organizationId: string;
  experimentId: string;
  variant: "A" | "B";
  eventType: "impression" | "reply" | "conversion";
  weight?: number;
}

export interface ExperimentMetrics {
  impressions: number;
  replies: number;
  conversions: number;
  replyRate: number;
  conversionProxy: number;
}

export interface ExperimentResults {
  experiment: ExperimentRecord;
  stats: {
    A: ExperimentMetrics;
    B: ExperimentMetrics;
  };
  winner: {
    variant: "A" | "B" | "none";
    confidence: number;
    reason: string;
  };
}

export interface VoiceRepository {
  setConsent(input: VoiceConsentInput): Promise<VoiceConsentRecord>;
  generatePreview(input: VoicePreviewInput): Promise<VoicePreviewResult>;
  sendVoiceNote(input: SendVoiceNoteInput): Promise<VoiceAuditLog>;
  listVoiceAuditLogs(organizationId: string, leadId?: string): Promise<VoiceAuditLog[]>;
  createExperiment(input: CreateExperimentInput): Promise<ExperimentRecord>;
  recordOutcome(input: RecordOutcomeInput): Promise<void>;
  getExperimentResults(organizationId: string, experimentId: string): Promise<ExperimentResults | null>;
}

type ExperimentEvent = {
  id: string;
  organizationId: string;
  experimentId: string;
  variant: "A" | "B";
  eventType: "impression" | "reply" | "conversion";
  weight: number;
  createdAt: string;
};

class InMemoryVoiceRepository implements VoiceRepository {
  private consents: VoiceConsentRecord[] = [];
  private audits: VoiceAuditLog[] = [];
  private experiments: ExperimentRecord[] = [];
  private experimentEvents: ExperimentEvent[] = [];

  async setConsent(input: VoiceConsentInput): Promise<VoiceConsentRecord> {
    const record: VoiceConsentRecord = {
      id: randomUUID(),
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      leadId: input.leadId,
      status: input.voiceCloneAllowed ? "granted" : "revoked",
      reason: input.reason,
      createdAt: new Date().toISOString(),
    };

    this.consents.unshift(record);
    return record;
  }

  async generatePreview(input: VoicePreviewInput): Promise<VoicePreviewResult> {
    const sourceTextHash = createHash("sha256").update(input.sourceText.trim()).digest("hex");

    return {
      previewId: `vp_${Date.now()}`,
      script: input.sourceText.trim(),
      sourceTextHash,
      provider: "mock",
      modelId: input.voiceModelId,
      state: "ready",
      audioUrl: `/mock-audio/${input.voiceModelId}/${Date.now()}.mp3`,
      generatedAt: new Date().toISOString(),
    };
  }

  async sendVoiceNote(input: SendVoiceNoteInput): Promise<VoiceAuditLog> {
    const sourceTextHash = createHash("sha256").update(input.sourceText.trim()).digest("hex");
    const audit: VoiceAuditLog = {
      id: randomUUID(),
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      leadId: input.leadId,
      conversationId: input.conversationId,
      voiceModelId: input.voiceModelId,
      sourceTextHash,
      previewId: input.previewId,
      status: "sent",
      createdAt: new Date().toISOString(),
    };

    this.audits.unshift(audit);
    return audit;
  }

  async listVoiceAuditLogs(organizationId: string, leadId?: string): Promise<VoiceAuditLog[]> {
    return this.audits.filter((item) => item.organizationId === organizationId && (!leadId || item.leadId === leadId));
  }

  async createExperiment(input: CreateExperimentInput): Promise<ExperimentRecord> {
    const experiment: ExperimentRecord = {
      id: randomUUID(),
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      name: input.name,
      trafficSplitA: input.trafficSplitA,
      variantA: input.variantA,
      variantB: input.variantB,
      createdAt: new Date().toISOString(),
    };

    this.experiments.unshift(experiment);
    return experiment;
  }

  async recordOutcome(input: RecordOutcomeInput): Promise<void> {
    this.experimentEvents.unshift({
      id: randomUUID(),
      organizationId: input.organizationId,
      experimentId: input.experimentId,
      variant: input.variant,
      eventType: input.eventType,
      weight: input.weight ?? 1,
      createdAt: new Date().toISOString(),
    });
  }

  async getExperimentResults(organizationId: string, experimentId: string): Promise<ExperimentResults | null> {
    const experiment = this.experiments.find((item) => item.id === experimentId && item.organizationId === organizationId);
    if (!experiment) return null;

    const events = this.experimentEvents.filter((item) => item.experimentId === experiment.id && item.organizationId === organizationId);
    const stats = {
      A: this.computeVariantStats(events, "A"),
      B: this.computeVariantStats(events, "B"),
    };

    return {
      experiment,
      stats,
      winner: computeWinner(stats.A, stats.B),
    };
  }

  private computeVariantStats(events: ExperimentEvent[], variant: "A" | "B"): ExperimentMetrics {
    const scoped = events.filter((item) => item.variant === variant);
    const impressions = scoped.filter((item) => item.eventType === "impression").reduce((sum, item) => sum + item.weight, 0);
    const replies = scoped.filter((item) => item.eventType === "reply").reduce((sum, item) => sum + item.weight, 0);
    const conversions = scoped.filter((item) => item.eventType === "conversion").reduce((sum, item) => sum + item.weight, 0);

    const safeImpressions = Math.max(1, impressions);

    return {
      impressions,
      replies,
      conversions,
      replyRate: replies / safeImpressions,
      conversionProxy: conversions / safeImpressions,
    };
  }
}

const repository: VoiceRepository = new InMemoryVoiceRepository();

export function computeWinner(variantA: ExperimentMetrics, variantB: ExperimentMetrics) {
  const minSample = 20;
  const baseConfidence = 0.5;

  if (variantA.impressions < minSample || variantB.impressions < minSample) {
    return {
      variant: "none" as const,
      confidence: baseConfidence,
      reason: "Muestra insuficiente (<20 impresiones por variante).",
    };
  }

  const liftA = variantA.replyRate * 0.6 + variantA.conversionProxy * 0.4;
  const liftB = variantB.replyRate * 0.6 + variantB.conversionProxy * 0.4;
  const diff = Math.abs(liftA - liftB);

  if (diff < 0.03) {
    return {
      variant: "none" as const,
      confidence: 0.58,
      reason: "Diferencia pequeña (<3pp) sin señal clara.",
    };
  }

  return {
    variant: liftA > liftB ? ("A" as const) : ("B" as const),
    confidence: Math.min(0.95, 0.62 + diff * 2),
    reason: "Ganador por mejor combinación de reply rate y conversion proxy.",
  };
}

export const voiceService = {
  async setConsent(input: VoiceConsentInput) {
    // TODO(Supabase): persist in voice_consents table with org/user scoping.
    return repository.setConsent(input);
  },

  async generatePreview(input: VoicePreviewInput) {
    // TODO(ElevenLabs): run TTS generation via provider adapter and return signed URL.
    return repository.generatePreview(input);
  },

  async sendVoiceNote(input: SendVoiceNoteInput) {
    // TODO(Channel Delivery): push generated audio to Meta/WhatsApp transport queue.
    return repository.sendVoiceNote(input);
  },

  async listVoiceAuditLogs(organizationId: string, leadId?: string) {
    return repository.listVoiceAuditLogs(organizationId, leadId);
  },

  async createExperiment(input: CreateExperimentInput) {
    return repository.createExperiment(input);
  },

  async recordOutcome(input: RecordOutcomeInput) {
    return repository.recordOutcome(input);
  },

  async computeWinner(organizationId: string, experimentId: string) {
    const results = await repository.getExperimentResults(organizationId, experimentId);
    return results?.winner ?? null;
  },

  async getExperimentResults(organizationId: string, experimentId: string) {
    return repository.getExperimentResults(organizationId, experimentId);
  },
};
