"use client";

import { useMemo, useState } from "react";
import type { ContentPieceMetrics } from "@/lib/attribution-service";

type SortKey = "publishedAt" | "platform" | "leadsGenerated" | "callsBooked" | "dealsWon" | "attributedRevenue" | "revenuePerPiece";

export function SortableRoiTable({ rows }: { rows: ContentPieceMetrics[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("attributedRevenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const factor = sortDir === "asc" ? 1 : -1;

      if (sortKey === "publishedAt") return (+new Date(a.piece.publishedAt) - +new Date(b.piece.publishedAt)) * factor;
      if (sortKey === "platform") return a.piece.platform.localeCompare(b.piece.platform) * factor;

      return ((a[sortKey] as number) - (b[sortKey] as number)) * factor;
    });

    return copy;
  }, [rows, sortDir, sortKey]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDir((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }

    setSortKey(nextKey);
    setSortDir("desc");
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0f1726]/80">
      <table className="min-w-full text-sm">
        <thead className="bg-white/[0.03] text-zinc-300">
          <tr>
            {[
              ["hook", "Pieza"],
              ["platform", "Plataforma"],
              ["publishedAt", "Publicado"],
              ["leadsGenerated", "Leads"],
              ["callsBooked", "Calls"],
              ["dealsWon", "Deals"],
              ["attributedRevenue", "Revenue"],
              ["revenuePerPiece", "$ por pieza"],
            ].map(([key, label]) => (
              <th key={key} className="px-3 py-2 text-left font-medium">
                {key === "hook" ? (
                  label
                ) : (
                  <button onClick={() => toggleSort(key as SortKey)} className="text-zinc-200 hover:text-[#d4e83a]">
                    {label}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={row.piece.id} className="border-t border-white/5 text-zinc-200">
              <td className="px-3 py-2">
                <p className="font-medium">{row.piece.hook}</p>
                <p className="text-xs text-zinc-400">{row.piece.type} · {row.piece.angle}</p>
              </td>
              <td className="px-3 py-2 uppercase">{row.piece.platform}</td>
              <td className="px-3 py-2">{new Date(row.piece.publishedAt).toLocaleDateString("es-ES")}</td>
              <td className="px-3 py-2">{row.leadsGenerated}</td>
              <td className="px-3 py-2">{row.callsBooked}</td>
              <td className="px-3 py-2">{row.dealsWon}</td>
              <td className="px-3 py-2">${row.attributedRevenue.toLocaleString("es-ES")}</td>
              <td className="px-3 py-2 font-semibold text-[#d4e83a]">${row.revenuePerPiece.toLocaleString("es-ES")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
