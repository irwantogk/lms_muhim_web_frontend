import type { CsvCell } from "@/lib/laporan/csv.ts";
import type { RekapAbsenRow } from "@/lib/laporan/types.ts";
import { formatDecimal } from "@/lib/laporan/format.ts";

export const ABSEN_CSV_HEADERS = [
  "Kelas",
  "Kode",
  "Mata Pelajaran",
  "Hadir",
  "Terlambat",
  "Izin",
  "Sakit",
  "Total Catatan",
  "% Kehadiran",
];

export function absenCsvRows(rows: RekapAbsenRow[]): CsvCell[][] {
  return rows.map((row) => [
    row.className,
    row.subjectCode,
    row.subjectName,
    row.hadir,
    row.terlambat,
    row.izin,
    row.sakit,
    row.opportunities,
    `${formatDecimal(row.presencePercent)}%`,
  ]);
}

export interface AbsenTableProps {
  rows: RekapAbsenRow[];
}

/** Tabel rekap kehadiran per kelas & mapel. */
export function AbsenTable({ rows }: AbsenTableProps) {
  if (rows.length === 0) {
    return (
      <p class="py-8 text-center text-sm text-content-muted">
        Tidak ada rekap kehadiran yang cocok dengan filter.
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
              Hadir
            </th>
            <th class="border-b border-border px-3 py-2 text-right font-semibold">
              Terlambat
            </th>
            <th class="border-b border-border px-3 py-2 text-right font-semibold">
              Izin
            </th>
            <th class="border-b border-border px-3 py-2 text-right font-semibold">
              Sakit
            </th>
            <th class="border-b border-border px-3 py-2 text-right font-semibold">
              % Kehadiran
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
              <td class="px-3 py-2 text-right text-xs tabular-nums text-status-hadir">
                {row.hadir}
              </td>
              <td class="px-3 py-2 text-right text-xs tabular-nums text-status-terlambat">
                {row.terlambat}
              </td>
              <td class="px-3 py-2 text-right text-xs tabular-nums text-status-izin">
                {row.izin}
              </td>
              <td class="px-3 py-2 text-right text-xs tabular-nums text-status-sakit">
                {row.sakit}
              </td>
              <td class="px-3 py-2 text-right text-xs font-semibold tabular-nums text-content">
                {formatDecimal(row.presencePercent)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
