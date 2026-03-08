import type { AdapterHealth, SupportedChannel } from "./types";

const state: Record<SupportedChannel, AdapterHealth> = {
  instagram: {
    channel: "instagram",
    state: "healthy",
    latencyMs: 120,
    queueDepth: 4,
    lastSyncAt: new Date().toISOString(),
    detail: "Mock activo sin credenciales",
  },
  whatsapp: {
    channel: "whatsapp",
    state: "degraded",
    latencyMs: 340,
    queueDepth: 9,
    lastSyncAt: new Date().toISOString(),
    detail: "Latencia simulada alta para pruebas de fallback",
  },
  email: {
    channel: "email",
    state: "healthy",
    latencyMs: 180,
    queueDepth: 3,
    lastSyncAt: new Date().toISOString(),
    detail: "SMTP mock en modo sandbox",
  },
};

export function getAdapterState(channel: SupportedChannel): AdapterHealth {
  return state[channel];
}

export function updateAdapterState(channel: SupportedChannel, updates: Partial<AdapterHealth>): AdapterHealth {
  state[channel] = {
    ...state[channel],
    ...updates,
    lastSyncAt: new Date().toISOString(),
  };

  return state[channel];
}
