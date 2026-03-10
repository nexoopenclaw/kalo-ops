export type FeatureFlagKey = "webhooks_live_processing" | "outbound_sends_live" | "automations_live_execute";

export interface FeatureFlagState {
  key: FeatureFlagKey;
  label: string;
  description: string;
  envValue: boolean;
  dbOverride: boolean | null;
  effectiveValue: boolean;
  mode: "live" | "mock";
  source: "env" | "db_override";
  updatedAt: string;
}

const labels: Record<FeatureFlagKey, { label: string; description: string; env: string }> = {
  webhooks_live_processing: {
    label: "Webhooks live processing",
    description: "Procesa webhooks con efectos reales sobre CRM/pipeline.",
    env: "KALO_FLAG_WEBHOOKS_LIVE_PROCESSING",
  },
  outbound_sends_live: {
    label: "Outbound sends live",
    description: "Permite envíos salientes reales por adapters/provider runtime.",
    env: "KALO_FLAG_OUTBOUND_SENDS_LIVE",
  },
  automations_live_execute: {
    label: "Automations live execute",
    description: "Permite ejecutar acciones de automations fuera de modo seguro/mock.",
    env: "KALO_FLAG_AUTOMATIONS_LIVE_EXECUTE",
  },
};

type OverrideMap = Partial<Record<FeatureFlagKey, { value: boolean; updatedAt: string }>>;

const globalKey = "__kaloOpsFeatureFlagOverrides__";

function envBool(name: string): boolean {
  const raw = (process.env[name] ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "on", "live"].includes(raw);
}

function getOverrides(): OverrideMap {
  const scoped = globalThis as typeof globalThis & { [globalKey]?: OverrideMap };
  if (!scoped[globalKey]) scoped[globalKey] = {};
  return scoped[globalKey] as OverrideMap;
}

export const featureFlags = {
  list(): FeatureFlagState[] {
    const overrides = getOverrides();
    return (Object.keys(labels) as FeatureFlagKey[]).map((key) => {
      const meta = labels[key];
      const envValue = envBool(meta.env);
      const dbOverride = overrides[key]?.value ?? null;
      const effectiveValue = dbOverride ?? envValue;
      return {
        key,
        label: meta.label,
        description: meta.description,
        envValue,
        dbOverride,
        effectiveValue,
        mode: effectiveValue ? "live" : "mock",
        source: dbOverride === null ? "env" : "db_override",
        updatedAt: overrides[key]?.updatedAt ?? new Date(0).toISOString(),
      };
    });
  },

  isEnabled(key: FeatureFlagKey): boolean {
    return this.list().find((item) => item.key === key)?.effectiveValue ?? false;
  },

  upsertOverride(key: FeatureFlagKey, value: boolean | null): FeatureFlagState {
    const overrides = getOverrides();
    if (value === null) {
      delete overrides[key];
    } else {
      overrides[key] = { value, updatedAt: new Date().toISOString() };
    }
    return this.list().find((item) => item.key === key)!;
  },
};
