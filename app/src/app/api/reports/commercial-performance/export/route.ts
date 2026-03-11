import { reportingService } from "@/lib/reporting-service";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = (url.searchParams.get("organizationId") ?? "org_1").trim();
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const format = (url.searchParams.get("format") ?? "csv").trim();

  const data = await reportingService.commercialPerformance(organizationId, from, to);

  if (format !== "csv") {
    return new Response(JSON.stringify({ ok: false, error: "Unsupported format", supported: ["csv"] }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const rows = data.aging.map((a) => ({
    dealId: a.dealId,
    leadName: a.leadName,
    stage: a.stage,
    daysOpen: a.daysOpen,
    value: a.value,
  }));

  const meta = [
    `# Kalo Ops — Commercial performance`,
    `# organizationId: ${organizationId}`,
    `# range.from: ${data.range.from ?? ""}`,
    `# range.to: ${data.range.to ?? ""}`,
    `# totals.created: ${data.totals.created}`,
    `# totals.booked: ${data.totals.booked}`,
    `# totals.won: ${data.totals.won}`,
    `# totals.bookingRate: ${data.totals.bookingRate}`,
    `# totals.closeRate: ${data.totals.closeRate}`,
    `# totals.wonValue: ${data.totals.wonValue}`,
    "",
  ].join("\n");

  const csv = meta + toCsv(rows, [
    { key: "dealId", label: "deal_id" },
    { key: "leadName", label: "lead_name" },
    { key: "stage", label: "stage" },
    { key: "daysOpen", label: "days_open" },
    { key: "value", label: "value" },
  ]);

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="commercial-performance_${organizationId}.csv"`,
      "cache-control": "no-store",
    },
  });
}
