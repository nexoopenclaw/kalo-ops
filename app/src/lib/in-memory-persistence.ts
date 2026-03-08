export type ExperimentState = "draft" | "running" | "paused" | "completed";

export interface VoiceConsentRecordStore {
  id: string;
  organizationId: string;
  actorUserId: string;
  leadId: string;
  status: "granted" | "revoked";
  reason?: string;
  createdAt: string;
}

export interface VoiceAuditEventStore {
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

export interface ExperimentStore {
  id: string;
  organizationId: string;
  actorUserId: string;
  name: string;
  goal: string;
  channel: "instagram" | "whatsapp" | "email" | "webchat";
  trafficSplitA: number;
  state: ExperimentState;
  variantA: {
    name: string;
    openerTemplate: string;
    followupTemplate: string;
  };
  variantB: {
    name: string;
    openerTemplate: string;
    followupTemplate: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentAssignmentStore {
  id: string;
  organizationId: string;
  experimentId: string;
  leadKey: string;
  variant: "A" | "B";
  bucket: number;
  createdAt: string;
}

export interface ExperimentOutcomeStore {
  id: string;
  organizationId: string;
  experimentId: string;
  variant: "A" | "B";
  eventType: "impression" | "reply" | "conversion";
  weight: number;
  createdAt: string;
}

export interface ContentPieceStore {
  id: string;
  organizationId: string;
  platform: "instagram" | "youtube" | "tiktok" | "linkedin" | "x";
  type: "reel" | "post" | "story" | "video" | "thread" | "newsletter";
  hook: string;
  angle: string;
  publishedAt: string;
}

export interface ContentAttributionStore {
  id: string;
  organizationId: string;
  leadId: string;
  contentPieceId: string;
  callBooked: boolean;
  dealWon: boolean;
  attributedRevenue: number;
  createdAt: string;
}

export interface ReportSnapshotStore {
  id: string;
  organizationId: string;
  reportType: "daily_digest" | "weekly_review";
  periodLabel: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AlertConfigStore {
  id: string;
  organizationId: string;
  ruleType: "vip_no_response" | "show_up_drop" | "inbound_spike" | "backlog";
  enabled: boolean;
  threshold: number;
  window: "1h" | "24h" | "7d";
  createdAt: string;
  updatedAt: string;
}

export type WebhookEventStatus = "processed" | "retrying" | "failed_permanent";

export interface WebhookProcessingLogEntryStore {
  at: string;
  level: "info" | "warn" | "error";
  message: string;
}

export interface WebhookEventStore {
  id: string;
  organizationId: string;
  channel: "instagram" | "whatsapp" | "email";
  externalId: string;
  idempotencyKey: string;
  payloadJson: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  processingLog: WebhookProcessingLogEntryStore[];
  status: WebhookEventStatus;
  retryCount: number;
  maxRetries: number;
  nextAttemptAt: string | null;
  latencyMs: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeadLetterEventStore {
  id: string;
  organizationId: string;
  webhookEventId: string;
  reason: string;
  requeuedAt: string | null;
  createdAt: string;
}

export interface InMemoryPersistenceState {
  voiceConsents: VoiceConsentRecordStore[];
  voiceAuditEvents: VoiceAuditEventStore[];
  experiments: ExperimentStore[];
  experimentAssignments: ExperimentAssignmentStore[];
  experimentOutcomes: ExperimentOutcomeStore[];
  contentPieces: ContentPieceStore[];
  contentAttributions: ContentAttributionStore[];
  reportSnapshots: ReportSnapshotStore[];
  alertConfigs: AlertConfigStore[];
  webhookEvents: WebhookEventStore[];
  deadLetterEvents: DeadLetterEventStore[];
}

const state: InMemoryPersistenceState = {
  voiceConsents: [],
  voiceAuditEvents: [],
  experiments: [],
  experimentAssignments: [],
  experimentOutcomes: [],
  contentPieces: [],
  contentAttributions: [],
  reportSnapshots: [],
  alertConfigs: [],
  webhookEvents: [],
  deadLetterEvents: [],
};

const globalKey = "__kaloOpsInMemoryState__";

export function getPersistenceState(): InMemoryPersistenceState {
  const scoped = globalThis as typeof globalThis & { [globalKey]?: InMemoryPersistenceState };
  if (!scoped[globalKey]) {
    scoped[globalKey] = state;
  }

  return scoped[globalKey] as InMemoryPersistenceState;
}
