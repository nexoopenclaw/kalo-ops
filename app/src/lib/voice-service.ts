import { createHash, randomUUID } from "node:crypto";
import { getPersistenceState, type ExperimentState } from "@/lib/in-memory-persistence";

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
  leadId: string;
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
  consentConfirmed: boolean;
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
  eventType: "preview_generated" | "voice_sent" | "voice_send_failed";
  message: string;
  createdAt: string;
}

export interface VoiceComplianceStatus {
  consentStatus: VoiceConsentStatus;
  lastConsentDate?: string;
  canSend: boolean;
}

export interface ExperimentVariantInput {
  name: string;
  openerTemplate: string;
  followupTemplate: string;
}

export interface CreateExperimentInput {
  organizationId: string;
  actorUserId: string;
  name: string;
  goal: string;
  channel: "instagram" | "whatsapp" | "email" | "webchat";
  trafficSplitA: number;
  variantA: ExperimentVariantInput;
  variantB: ExperimentVariantInput;
}

export interface ExperimentRecord extends CreateExperimentInput {
  id: string;
  state: ExperimentState;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentAssignmentInput {
  organizationId: string;
  experimentId: string;
  leadKey: string;
}

export interface ExperimentAssignment {
  experimentId: string;
  leadKey: string;
  variant: "A" | "B";
  bucket: number;
  state: ExperimentState;
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
  conversionRate: number;
}

export interface ExperimentResults {
  experiment: ExperimentRecord;
  timeWindow: { from: string; to: string };
  stats: { A: ExperimentMetrics; B: ExperimentMetrics };
  liftPercent: number;
  confidenceBadge: "baja" | "media" | "alta";
  winner: {
    variant: "A" | "B" | "none";
    confidence: number;
    reason: string;
    state: "sin_datos" | "no_concluyente" | "ganador";
  };
}

export const voiceService = {
  async setConsent(input: VoiceConsentInput): Promise<VoiceConsentRecord> {
    const db = getPersistenceState();
    const record: VoiceConsentRecord = {
      id: randomUUID(),
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      leadId: input.leadId,
      status: input.voiceCloneAllowed ? "granted" : "revoked",
      reason: input.reason,
      createdAt: new Date().toISOString(),
    };
    db.voiceConsents.unshift(record);
    return record;
  },

  async revokeConsent(input: Omit<VoiceConsentInput, "voiceCloneAllowed">): Promise<VoiceConsentRecord> {
    return this.setConsent({ ...input, voiceCloneAllowed: false, reason: input.reason ?? "Revocado manualmente" });
  },

  async getComplianceStatus(organizationId: string, leadId: string): Promise<VoiceComplianceStatus> {
    const db = getPersistenceState();
    const last = db.voiceConsents.find((item) => item.organizationId === organizationId && item.leadId === leadId);
    const consentStatus = last?.status ?? "revoked";
    return {
      consentStatus,
      lastConsentDate: last?.createdAt,
      canSend: consentStatus === "granted",
    };
  },

  async generatePreview(input: VoicePreviewInput): Promise<VoicePreviewResult> {
    const db = getPersistenceState();
    const sourceTextHash = createHash("sha256").update(input.sourceText.trim()).digest("hex");
    const now = new Date().toISOString();
    const preview: VoicePreviewResult = {
      previewId: `vp_${Date.now()}`,
      script: input.sourceText.trim(),
      sourceTextHash,
      provider: "mock",
      modelId: input.voiceModelId,
      state: "ready",
      audioUrl: `/mock-audio/${input.voiceModelId}/${Date.now()}.mp3`,
      generatedAt: now,
    };

    db.voiceAuditEvents.unshift({
      id: randomUUID(),
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      leadId: input.leadId,
      voiceModelId: input.voiceModelId,
      sourceTextHash,
      previewId: preview.previewId,
      eventType: "preview_generated",
      message: "Preview generado en entorno mock.",
      createdAt: now,
    });

    return preview;
  },

  async sendVoiceNote(input: SendVoiceNoteInput): Promise<VoiceAuditLog> {
    const db = getPersistenceState();
    const sourceTextHash = createHash("sha256").update(input.sourceText.trim()).digest("hex");
    const compliance = await this.getComplianceStatus(input.organizationId, input.leadId);
    const now = new Date().toISOString();

    if (!input.consentConfirmed || !compliance.canSend) {
      const denied: VoiceAuditLog = {
        id: randomUUID(),
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        leadId: input.leadId,
        conversationId: input.conversationId,
        voiceModelId: input.voiceModelId,
        sourceTextHash,
        previewId: input.previewId,
        eventType: "voice_send_failed",
        message: "Envío bloqueado: falta consentimiento explícito vigente.",
        createdAt: now,
      };
      db.voiceAuditEvents.unshift(denied);
      return denied;
    }

    const sent: VoiceAuditLog = {
      id: randomUUID(),
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      leadId: input.leadId,
      conversationId: input.conversationId,
      voiceModelId: input.voiceModelId,
      sourceTextHash,
      previewId: input.previewId,
      eventType: "voice_sent",
      message: "Voice note enviada en cola mock.",
      createdAt: now,
    };
    db.voiceAuditEvents.unshift(sent);
    return sent;
  },

  async listVoiceAuditLogs(organizationId: string, leadId?: string): Promise<VoiceAuditLog[]> {
    const db = getPersistenceState();
    return db.voiceAuditEvents.filter((item) => item.organizationId === organizationId && (!leadId || item.leadId === leadId));
  },

  async createExperiment(input: CreateExperimentInput): Promise<ExperimentRecord> {
    const db = getPersistenceState();
    const now = new Date().toISOString();
    const experiment: ExperimentRecord = {
      id: randomUUID(),
      ...input,
      state: "draft",
      createdAt: now,
      updatedAt: now,
    };
    db.experiments.unshift(experiment);
    return experiment;
  },

  async transitionExperimentState(organizationId: string, experimentId: string, nextState: ExperimentState): Promise<ExperimentRecord | null> {
    const db = getPersistenceState();
    const experiment = db.experiments.find((item) => item.organizationId === organizationId && item.id === experimentId);
    if (!experiment) return null;
    experiment.state = nextState;
    experiment.updatedAt = new Date().toISOString();
    return experiment;
  },

  async assignVariant(input: ExperimentAssignmentInput): Promise<ExperimentAssignment | null> {
    const db = getPersistenceState();
    const experiment = db.experiments.find((item) => item.organizationId === input.organizationId && item.id === input.experimentId);
    if (!experiment) return null;

    const stable = db.experimentAssignments.find(
      (item) => item.organizationId === input.organizationId && item.experimentId === input.experimentId && item.leadKey === input.leadKey,
    );
    if (stable) {
      return {
        experimentId: stable.experimentId,
        leadKey: stable.leadKey,
        variant: stable.variant,
        bucket: stable.bucket,
        state: experiment.state,
      };
    }

    const bucket = Number.parseInt(createHash("sha256").update(`${input.experimentId}:${input.leadKey}`).digest("hex").slice(0, 8), 16) % 100;
    const variant: "A" | "B" = bucket < experiment.trafficSplitA ? "A" : "B";

    db.experimentAssignments.unshift({
      id: randomUUID(),
      organizationId: input.organizationId,
      experimentId: input.experimentId,
      leadKey: input.leadKey,
      variant,
      bucket,
      createdAt: new Date().toISOString(),
    });

    return { experimentId: input.experimentId, leadKey: input.leadKey, variant, bucket, state: experiment.state };
  },

  async recordOutcome(input: RecordOutcomeInput): Promise<{ blocked: boolean; reason?: string }> {
    const db = getPersistenceState();
    const experiment = db.experiments.find((item) => item.id === input.experimentId && item.organizationId === input.organizationId);
    if (!experiment) return { blocked: true, reason: "EXPERIMENT_NOT_FOUND" };
    if (experiment.state !== "running") return { blocked: true, reason: "EXPERIMENT_NOT_RUNNING" };

    db.experimentOutcomes.unshift({
      id: randomUUID(),
      organizationId: input.organizationId,
      experimentId: input.experimentId,
      variant: input.variant,
      eventType: input.eventType,
      weight: Math.max(1, Math.floor(input.weight ?? 1)),
      createdAt: new Date().toISOString(),
    });

    return { blocked: false };
  },

  async getExperimentResults(organizationId: string, experimentId: string, from?: string, to?: string): Promise<ExperimentResults | null> {
    const db = getPersistenceState();
    const experiment = db.experiments.find((item) => item.id === experimentId && item.organizationId === organizationId);
    if (!experiment) return null;

    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const events = db.experimentOutcomes.filter((item) => {
      if (item.experimentId !== experimentId || item.organizationId !== organizationId) return false;
      const time = new Date(item.createdAt).getTime();
      return time >= fromDate.getTime() && time <= toDate.getTime();
    });

    const stats = {
      A: computeVariantStats(events, "A"),
      B: computeVariantStats(events, "B"),
    };

    const winner = computeWinner(stats.A, stats.B);
    const baseline = Math.max(stats.A.conversionRate, 0.00001);
    const liftPercent = ((stats.B.conversionRate - stats.A.conversionRate) / baseline) * 100;

    return {
      experiment,
      timeWindow: { from: fromDate.toISOString(), to: toDate.toISOString() },
      stats,
      liftPercent,
      confidenceBadge: winner.confidence >= 0.8 ? "alta" : winner.confidence >= 0.65 ? "media" : "baja",
      winner,
    };
  },
};

function computeVariantStats(
  events: Array<{ variant: "A" | "B"; eventType: "impression" | "reply" | "conversion"; weight: number }>,
  variant: "A" | "B",
): ExperimentMetrics {
  const scoped = events.filter((item) => item.variant === variant);
  const impressions = scoped.filter((item) => item.eventType === "impression").reduce((sum, item) => sum + item.weight, 0);
  const replies = scoped.filter((item) => item.eventType === "reply").reduce((sum, item) => sum + item.weight, 0);
  const conversions = scoped.filter((item) => item.eventType === "conversion").reduce((sum, item) => sum + item.weight, 0);
  const denom = Math.max(1, impressions);
  return {
    impressions,
    replies,
    conversions,
    replyRate: replies / denom,
    conversionRate: conversions / denom,
  };
}

export function computeWinner(variantA: ExperimentMetrics, variantB: ExperimentMetrics) {
  const minSample = 20;

  if (variantA.impressions + variantB.impressions === 0) {
    return { variant: "none" as const, confidence: 0.5, reason: "Sin eventos registrados.", state: "sin_datos" as const };
  }

  if (variantA.impressions < minSample || variantB.impressions < minSample) {
    return {
      variant: "none" as const,
      confidence: 0.58,
      reason: "Muestra insuficiente (<20 impresiones por variante).",
      state: "no_concluyente" as const,
    };
  }

  const scoreA = variantA.replyRate * 0.35 + variantA.conversionRate * 0.65;
  const scoreB = variantB.replyRate * 0.35 + variantB.conversionRate * 0.65;
  const diff = Math.abs(scoreA - scoreB);

  if (diff < 0.02) {
    return {
      variant: "none" as const,
      confidence: 0.63,
      reason: "Diferencia pequeña (<2pp).",
      state: "no_concluyente" as const,
    };
  }

  return {
    variant: scoreA > scoreB ? ("A" as const) : ("B" as const),
    confidence: Math.min(0.96, 0.68 + diff * 2.4),
    reason: "Ganador por mejor conversión ponderada con replies.",
    state: "ganador" as const,
  };
}
