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

export interface AttributionFallbackMappingStore {
  id: string;
  organizationId: string;
  matchPattern: string;
  contentPieceId: string;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface OnboardingStateStore {
  organizationId: string;
  completedTaskKeys: Array<"connect_channel" | "create_pipeline" | "import_leads" | "activate_automation" | "configure_alerts">;
  completedAt: string | null;
  updatedAt: string;
}

export interface CustomerHealthSnapshotStore {
  id: string;
  organizationId: string;
  name: string;
  segment: string;
  adoptionScore: number;
  activityScore: number;
  conversionTrend: number;
  riskLevel: "green" | "yellow" | "red";
  reasons: string[];
  suggestedActions: string[];
  mrrUsd: number;
  lastActivityAt: string;
}

export interface HealthActionLogStore {
  id: string;
  organizationId: string;
  orgId: string;
  actionLabel: string;
  owner: string;
  note?: string;
  createdAt: string;
}

export interface IntegrationEventLogStore {
  id: string;
  provider: "calendly" | "stripe";
  externalEventId: string;
  status: "processed" | "ignored" | "failed";
  payload: Record<string, unknown>;
  processedAt: string;
  error: string | null;
  idempotencyKey?: string;
  correlationId?: string;
  deadLetterReason?: string | null;
}

export interface RevenueBridgeDeadLetterStore {
  id: string;
  provider: "calendly" | "stripe";
  externalEventId: string;
  reason: string;
  details: string;
  correlationId?: string;
  createdAt: string;
}

export interface BridgeTransitionStore {
  id: string;
  dealId: string;
  fromStage: string;
  toStage: string;
  sourceProvider: "calendly" | "stripe";
  externalEventId: string;
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
  attributionFallbackMappings: AttributionFallbackMappingStore[];
  reportSnapshots: ReportSnapshotStore[];
  alertConfigs: AlertConfigStore[];
  webhookEvents: WebhookEventStore[];
  deadLetterEvents: DeadLetterEventStore[];
  onboardingStates: OnboardingStateStore[];
  customerHealthSnapshots: CustomerHealthSnapshotStore[];
  healthActionsLog: HealthActionLogStore[];
  integrationEventLog: IntegrationEventLogStore[];
  bridgeTransitions: BridgeTransitionStore[];
  revenueBridgeDeadLetters: RevenueBridgeDeadLetterStore[];
}

const state: InMemoryPersistenceState = {
  voiceConsents: [],
  voiceAuditEvents: [],
  experiments: [],
  experimentAssignments: [],
  experimentOutcomes: [],
  contentPieces: [],
  contentAttributions: [],
  attributionFallbackMappings: [],
  reportSnapshots: [],
  alertConfigs: [],
  webhookEvents: [],
  deadLetterEvents: [],
  onboardingStates: [],
  customerHealthSnapshots: [],
  healthActionsLog: [],
  integrationEventLog: [],
  bridgeTransitions: [],
  revenueBridgeDeadLetters: [],
};

const globalKey = "__kaloOpsInMemoryState__";

export function getPersistenceState(): InMemoryPersistenceState {
  const scoped = globalThis as typeof globalThis & { [globalKey]?: InMemoryPersistenceState };
  if (!scoped[globalKey]) {
    scoped[globalKey] = state;
  }

  return scoped[globalKey] as InMemoryPersistenceState;
}
