import { createHash } from "node:crypto";
import { getPersistenceState } from "@/lib/in-memory-persistence";

export const outboundSafeguards = {
  ensureOrg(organizationId: string) {
    const state = getPersistenceState();
    const found = state.orgSafeguards.find((item) => item.organizationId === organizationId);
    if (found) return found;
    const created = { organizationId, globalDryRun: true, updatedAt: new Date().toISOString() };
    state.orgSafeguards.push(created);
    return created;
  },

  setGlobalDryRun(organizationId: string, enabled: boolean) {
    const record = this.ensureOrg(organizationId);
    record.globalDryRun = enabled;
    record.updatedAt = new Date().toISOString();
    return { ...record };
  },

  getGlobalDryRun(organizationId: string) {
    return this.ensureOrg(organizationId).globalDryRun;
  },

  hashRequest(payload: unknown) {
    return createHash("sha256").update(JSON.stringify(payload ?? {})).digest("hex");
  },

  findIdempotent(organizationId: string, key: string, scope: string, requestHash: string) {
    return (
      getPersistenceState().outboundIdempotency.find(
        (item) => item.organizationId === organizationId && item.key === key && item.scope === scope && item.requestHash === requestHash,
      ) ?? null
    );
  },

  storeIdempotent(organizationId: string, key: string, scope: string, requestHash: string, response: Record<string, unknown>) {
    getPersistenceState().outboundIdempotency.unshift({ key, organizationId, scope, requestHash, response, createdAt: new Date().toISOString() });
  },
};
