import { fail } from "@/lib/api-response";
import { reportingService } from "@/lib/reporting-service";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId")?.trim();
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const format = (url.searchParams.get("format") ?? "csv").trim();

  if (!organizationId) {
    return fail(
      {
        code: "MISSING_ORGANIZATION_ID",
        message: "Query param 'organizationId' is required.",
      },
      400,
    );
  }

  const data = await reportingService.attributionPerformance(organizationId, from, to);

  if (format !== "csv") {
    return fail(
      {
        code: "UNSUPPORTED_FORMAT",
        message: "Unsupported format",
        details: { supported: ["csv"] },
      },
      400,
    );
  }

  const rows = data.topContent.map((c) => ({
    contentPieceId: c.contentPieceId,
    platform: c.platform,
    hook: c.hook,
    publishedAt: c.publishedAt,
    leads: c.leads,
    won: c.won,
    value: c.value,
  }));

  const meta = [
    `# Kalo Ops — Attribution performance`,
    `# organizationId: ${organizationId}`,
    `# range.from: ${data.range.from ?? ""}`,
    `# range.to: ${data.range.to ?? ""}`,
    `# fallback.mappedLeads: ${data.fallback.mappedLeads}`,
    `# fallback.inspectedLeads: ${data.fallback.inspectedLeads}`,
    "",
  ].join("\n");

  const csv = meta + toCsv(rows, [
    { key: "contentPieceId", label: "content_piece_id" },
    { key: "platform", label: "platform" },
    { key: "hook", label: "hook" },
    { key: "publishedAt", label: "published_at" },
    { key: "leads", label: "leads" },
    { key: "won", label: "won" },
    { key: "value", label: "value" },
  ]);

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="attribution-performance_${organizationId}.csv"`,
      "cache-control": "no-store",
    },
  });
}
