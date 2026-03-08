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

export interface InMemoryPersistenceState {
  voiceConsents: VoiceConsentRecordStore[];
  voiceAuditEvents: VoiceAuditEventStore[];
  experiments: ExperimentStore[];
  experimentAssignments: ExperimentAssignmentStore[];
  experimentOutcomes: ExperimentOutcomeStore[];
}

const state: InMemoryPersistenceState = {
  voiceConsents: [],
  voiceAuditEvents: [],
  experiments: [],
  experimentAssignments: [],
  experimentOutcomes: [],
};

const globalKey = "__kaloOpsInMemoryState__";

export function getPersistenceState(): InMemoryPersistenceState {
  const scoped = globalThis as typeof globalThis & { [globalKey]?: InMemoryPersistenceState };
  if (!scoped[globalKey]) {
    scoped[globalKey] = state;
  }

  return scoped[globalKey] as InMemoryPersistenceState;
}
