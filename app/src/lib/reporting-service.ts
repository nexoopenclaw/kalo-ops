import { attributionService } from "@/lib/attribution-service";
import { crmService } from "@/lib/crm-service";

function inRange(iso: string, from?: string, to?: string) {
  const ts = +new Date(iso);
  if (from && ts < +new Date(from)) return false;
  if (to && ts > +new Date(to)) return false;
  return true;
}

function pct(n: number, d: number) {
  return d ? Number(((n / d) * 100).toFixed(1)) : 0;
}

export const reportingService = {
  async commercialPerformance(organizationId: string, from?: string, to?: string) {
    const deals = (await crmService.listDeals(organizationId)).filter((d) => inRange(d.createdAt, from, to));
    const booked = deals.filter((d) => ["booked", "show", "won"].includes(d.stage));
    const won = deals.filter((d) => d.stage === "won");
    const aging = deals
      .filter((d) => !["won", "lost"].includes(d.stage))
      .map((d) => ({ dealId: d.id, leadName: d.leadProfile.fullName, stage: d.stage, daysOpen: Math.max(0, Math.round((Date.now() - +new Date(d.createdAt)) / 86400000)), value: d.value }))
      .sort((a, b) => b.daysOpen - a.daysOpen)
      .slice(0, 20);

    return {
      range: { from: from ?? null, to: to ?? null },
      totals: {
        created: deals.length,
        booked: booked.length,
        won: won.length,
        bookingRate: pct(booked.length, deals.length),
        closeRate: pct(won.length, booked.length),
        wonValue: won.reduce((sum, d) => sum + d.value, 0),
      },
      aging,
    };
  },

  async attributionPerformance(organizationId: string, from?: string, to?: string) {
    const metrics = await attributionService.listContentMetrics(organizationId);
    const explainLeadIds = ["lead_1", "lead_2", "lead_3", "lead_4", "lead_5"];
    const explains = await Promise.all(explainLeadIds.map((leadId) => attributionService.explainLeadAttribution(leadId, organizationId)));
    const fallbackHits = explains.filter((e) => e.reasons.some((r) => r.rule === "fallback_mapping")).length;

    const top = metrics
      .map((m) => ({
        contentPieceId: m.piece.id,
        hook: m.piece.hook,
        platform: m.piece.platform,
        publishedAt: m.piece.publishedAt,
        leads: m.leadsGenerated,
        won: m.dealsWon,
        value: m.attributedRevenue,
      }))
      .filter((row) => inRange(row.publishedAt, from, to))
      .sort((a, b) => b.value - a.value || b.won - a.won)
      .slice(0, 10);

    return {
      range: { from: from ?? null, to: to ?? null },
      topContent: top,
      fallback: {
        mappedLeads: fallbackHits,
        inspectedLeads: explains.length,
      },
    };
  },
};
