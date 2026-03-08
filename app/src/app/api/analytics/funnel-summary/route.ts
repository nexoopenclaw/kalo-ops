import { NextResponse } from "next/server";
import { crmService, type DealStage, type FunnelSummary, type ListDealsFilters } from "@/lib/crm-service";

type FunnelSummaryResponse = {
  ok: true;
  data: FunnelSummary;
  deals: Awaited<ReturnType<typeof crmService.listDeals>>;
};

type FunnelSummaryError = {
  ok: false;
  error: string;
};

const allowedStages: DealStage[] = ["new", "qualified", "booked", "show", "won", "lost"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId") ?? "org_1";
  const stage = url.searchParams.get("stage") as DealStage | null;
  const atRiskDaysRaw = url.searchParams.get("atRiskDays");
  const atRiskDays = atRiskDaysRaw ? Number(atRiskDaysRaw) : 5;

  if (stage && !allowedStages.includes(stage)) {
    return NextResponse.json<FunnelSummaryError>({ ok: false, error: "stage inválido" }, { status: 400 });
  }

  if (Number.isNaN(atRiskDays) || atRiskDays < 1 || atRiskDays > 90) {
    return NextResponse.json<FunnelSummaryError>({ ok: false, error: "atRiskDays debe estar entre 1 y 90" }, { status: 400 });
  }

  const filters: ListDealsFilters = {
    ownerId: url.searchParams.get("ownerId") ?? undefined,
    stage: stage ?? undefined,
    query: url.searchParams.get("query") ?? undefined,
    fromDate: url.searchParams.get("fromDate") ?? undefined,
    toDate: url.searchParams.get("toDate") ?? undefined,
  };

  const [deals, baseSummary] = await Promise.all([
    crmService.listDeals(organizationId, filters),
    crmService.getFunnelSummary(organizationId, atRiskDays),
  ]);

  const data: FunnelSummary = {
    ...baseSummary,
    totalDeals: deals.length,
    revenueInPlayTotal: deals.filter((deal) => !["won", "lost"].includes(deal.stage)).reduce((sum, deal) => sum + deal.value, 0),
    revenueByStage: baseSummary.revenueByStage.map((item) => {
      const scoped = deals.filter((deal) => deal.stage === item.stage);
      return {
        ...item,
        deals: scoped.length,
        totalValue: scoped.reduce((sum, deal) => sum + deal.value, 0),
      };
    }),
    topObjections: baseSummary.topObjections
      .map((item) => ({ label: item.label, count: deals.filter((deal) => deal.objections.includes(item.label)).length }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    dealsAtRisk: baseSummary.dealsAtRisk.filter((risk) => deals.some((deal) => deal.id === risk.dealId)),
  };

  return NextResponse.json<FunnelSummaryResponse>({ ok: true, data, deals });
}
