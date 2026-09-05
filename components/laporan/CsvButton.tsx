import { type CsvCell, csvDownloadUrl } from "@/lib/laporan/csv.ts";

export interface CsvButtonProps {
  /** Nama file saat diunduh, contoh: "rekap-nilai-guru.csv". */
  filename: string;
  headers: string[];
  rows: CsvCell[][];
  label?: string;
  disabled?: boolean;
}

/** Tombol unduh CSV yang dibuat langsung dari data yang sedang ditampilkan. */
export function CsvButton({
  filename,
  headers,
  rows,
  label = "Unduh CSV",
  disabled = false,
}: CsvButtonProps) {
  const classes =
    "inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-content transition-colors";

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        title="Belum ada data untuk diunduh"
        class={`${classes} cursor-not-allowed opacity-50`}
      >
        {label}
      </span>
    );
  }

  return (
    <a
      href={csvDownloadUrl(headers, rows)}
      download={filename}
      class={`${classes} hover:border-primary hover:text-primary`}
    >
      {label}
    </a>
  );
}
