/** Baris nilai sel CSV: angka atau teks atau kosong. */
export type CsvCell = string | number | null | undefined;

function escapeCell(value: CsvCell): string {
  const text = String(value ?? "");
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Susun konten CSV dari deretan header + baris data. */
export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const serialize = (row: CsvCell[]) => row.map(escapeCell).join(",");
  return [headers.map(escapeCell).join(","), ...rows.map(serialize)].join("\n");
}

/**
 * Buat URL data untuk mengunduh CSV (dipakai atribut `download`).
 * Disertakan BOM agar Excel membuka karakter UTF-8 (mis. é, ") dengan benar.
 */
export function csvDownloadUrl(headers: string[], rows: CsvCell[][]): string {
  return `data:text/csv;charset=utf-8,${
    encodeURIComponent(
      `\uFEFF${toCsv(headers, rows)}`,
    )
  }`;
}
