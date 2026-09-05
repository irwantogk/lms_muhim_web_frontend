import type { CsvCell } from "@/lib/laporan/csv.ts";
import type { RekapNilaiRow } from "@/lib/laporan/types.ts";
import { formatDecimal } from "@/lib/laporan/format.ts";

export const NILAI_CSV_HEADERS = [
  "Kelas",
  "Kode",
  "Mata Pelajaran",
  "Jumlah Tugas",
  "Tugas Dinilai",
  "Rata-rata",
  "Tertinggi",
  "Terendah",
];

export function nilaiCsvRows(rows: RekapNilaiRow[]): CsvCell[][] {
  return rows.map((row) => [
    row.className,
    row.subjectCode,
    row.subjectName,
    row.taskCount,
    row.gradedCount,
    row.average,
    row.highest,
    row.lowest,
  ]);
}

export interface NilaiTableProps {
  rows: RekapNilaiRow[];
}

/** Tabel rekap nilai per kelas & mapel. */
export function NilaiTable({ rows }: NilaiTableProps) {
  if (rows.length === 0) {
    return (
      <p class="py-8 text-center text-sm text-content-muted">
        Tidak ada rekap nilai yang cocok dengan filter.
      </p>
    );
  }

  return (
    <div class="overflow-x-auto">
      <table class="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-wide text-content-muted">
            <th class="border-b border-border px-3 py-2 font-semibold">
              Kelas
            </th>
            <th class="border-b border-border px-3 py-2 font-semibold">
              Mapel
            </th>
            <th class="border-b border-border px-3 py-2 text-right font-semibold">
              Tugas
            </th>
            <th class="border-b border-border px-3 py-2 text-right font-semibold">
              Dinilai
            </th>
            <th class="border-b border-border px-3 py-2 text-right font-semibold">
              Rata-rata
            </th>
            <th class="border-b border-border px-3 py-2 text-right font-semibold">
              Tertinggi
            </th>
            <th class="border-b border-border px-3 py-2 text-right font-semibold">
              Terendah
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} class="border-b border-border align-top">
              <td class="whitespace-nowrap px-3 py-2 text-xs font-medium text-content">
                {row.className}
              </td>
              <td class="px-3 py-2">
                <span class="font-medium text-content">{row.subjectName}</span>
                <span class="ml-1 text-xs text-content-muted">
                  {row.subjectCode}
                </span>
              </td>
              <td class="px-3 py-2 text-right text-xs tabular-nums text-content-muted">
                {row.taskCount}
              </td>
              <td class="px-3 py-2 text-right text-xs tabular-nums text-content">
                {row.gradedCount}
              </td>
              <td class="px-3 py-2 text-right text-xs font-semibold tabular-nums text-role-murid">
                {row.average == null ? "—" : formatDecimal(row.average)}
              </td>
              <td class="px-3 py-2 text-right text-xs tabular-nums text-status-hadir">
                {row.highest ?? "—"}
              </td>
              <td class="px-3 py-2 text-right text-xs tabular-nums text-status-sakit">
                {row.lowest ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
