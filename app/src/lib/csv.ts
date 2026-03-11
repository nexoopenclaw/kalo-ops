type CsvValue = string | number | boolean | null | undefined | Date;

function normalize(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function escapeCsvCell(raw: string): string {
  // RFC4180-ish: quote if contains comma/quote/newline.
  if (!/[",\n\r]/.test(raw)) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

export function toCsv<Row extends Record<string, CsvValue>>(
  rows: Row[],
  columns: Array<{ key: keyof Row; label?: string }>,
) {
  const header = columns.map((c) => escapeCsvCell(c.label ?? String(c.key))).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCsvCell(normalize(row[c.key]))).join(","));
  return `${header}\n${lines.join("\n")}\n`;
}
