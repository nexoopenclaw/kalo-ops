import { crmService } from "@/lib/crm-service";
import { inboxService } from "@/lib/inbox-service";

export interface IntegrityIssue {
  code: string;
  severity: "warn" | "error";
  entity: "lead" | "conversation" | "deal";
  message: string;
  suggestedFix: string;
}

export const integrityCheckService = {
  async run(organizationId = "org_1") {
    const deals = await crmService.listDeals(organizationId);
    const conversations = await inboxService.listConversations();

    const issues: IntegrityIssue[] = [];

    const dealLeadIds = new Set(deals.map((deal) => deal.leadId));

    for (const conv of conversations) {
      if (conv.organizationId !== organizationId) continue;
      if (!dealLeadIds.has(conv.leadId)) {
        issues.push({
          code: "MISSING_DEAL_FOR_CONVERSATION",
          severity: "warn",
          entity: "conversation",
          message: `Conversación ${conv.id} referencia lead ${conv.leadId} sin deal asociado.`,
          suggestedFix: "Crear deal para ese lead o corregir lead_id en la conversación.",
        });
      }
    }

    for (const deal of deals) {
      const hasConversation = conversations.some((conv) => conv.organizationId === organizationId && conv.leadId === deal.leadId);
      if (!hasConversation) {
        issues.push({
          code: "MISSING_CONVERSATION_FOR_DEAL",
          severity: "warn",
          entity: "deal",
          message: `Deal ${deal.id} (${deal.leadProfile.email}) no tiene conversación vinculada.`,
          suggestedFix: "Crear conversación inicial para el lead o validar el lead_id en CRM.",
        });
      }
    }

    const emailIndex = new Map<string, string>();
    for (const deal of deals) {
      const email = deal.leadProfile.email.toLowerCase();
      if (emailIndex.has(email) && emailIndex.get(email) !== deal.id) {
        issues.push({
          code: "DUPLICATE_LEAD_EMAIL",
          severity: "error",
          entity: "lead",
          message: `Email duplicado en deals: ${email}.`,
          suggestedFix: "Fusionar leads/deals duplicados y conservar un único registro maestro.",
        });
      } else {
        emailIndex.set(email, deal.id);
      }
    }

    return {
      organizationId,
      checkedAt: new Date().toISOString(),
      issues,
      summary: {
        total: issues.length,
        errors: issues.filter((item) => item.severity === "error").length,
        warnings: issues.filter((item) => item.severity === "warn").length,
      },
    };
  },
};
