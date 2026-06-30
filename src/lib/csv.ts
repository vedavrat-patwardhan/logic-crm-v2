type Cell = string | number | null | undefined;

function escapeCell(value: Cell): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** Build CSV text from a 2D array (first row = headers). */
export function toCsv(rows: Cell[][]): string {
  return rows.map((r) => r.map(escapeCell).join(",")).join("\n");
}

/** Trigger a client-side CSV download. */
export function downloadCsv(filename: string, rows: Cell[][]): void {
  const blob = new Blob([toCsv(rows)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
