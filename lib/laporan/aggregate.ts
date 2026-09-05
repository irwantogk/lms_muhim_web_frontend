import type { RekapAbsenRow, RekapNilaiRow } from "./types.ts";
import { averageOf, round1 } from "./format.ts";

/** Rata-rata nilai dari kumpulan rekap nilai (dipakai kartu ringkasan). */
export function recapAverage(rows: RekapNilaiRow[]): number | null {
  return averageOf(
    rows
      .map((row) => row.average)
      .filter((value): value is number => value != null),
  );
}

/** Rata-rata persentase kehadiran dari kumpulan rekap absen. */
export function recapPresence(rows: RekapAbsenRow[]): number {
  if (rows.length === 0) return 0;
  return round1(
    rows.reduce((sum, row) => sum + row.presencePercent, 0) / rows.length,
  );
}
