import type { ProviderId } from "@/lib/config";

export type ProviderTestStatus = "ok" | "not_configured" | "error";

export interface ProviderTestResult {
  provider: ProviderId;
  status: ProviderTestStatus;
  message: string;
  missingKeys: string[];
  checkedAt: string;
}

export interface ProviderAdapter {
  id: ProviderId;
  displayName: string;
  isConfigured: boolean;
  missingKeys: string[];
  testConnection: () => Promise<ProviderTestResult>;
}

export function notConfiguredResult(provider: ProviderId, missingKeys: string[]): ProviderTestResult {
  return {
    provider,
    status: "not_configured",
    message: "Faltan credenciales para ejecutar la prueba de integración.",
    missingKeys,
    checkedAt: new Date().toISOString(),
  };
}
