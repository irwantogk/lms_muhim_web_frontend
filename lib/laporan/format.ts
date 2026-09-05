/** Format angka dengan maksimal satu desimal (pembulatan). */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Rata-rata deret angka, null bila kosong. */
export function averageOf(values: number[]): number | null {
  if (values.length === 0) return null;
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/** Persentase a/b (0 bila b = 0), dibulatkan 1 desimal. */
export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return round1((part / whole) * 100);
}

/** Label hari pendek (Sen/Kam/dst) dari objek Date. */
export const DAY_SHORT = [
  "Min",
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
];

/** Label tanggal pendek, contoh: "Sen, 4 Sep 2026". */
export function shortDateLabel(date: Date): string {
  const day = DAY_SHORT[date.getDay()] ?? "-";
  const dateLabel = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${day}, ${dateLabel}`;
}

/** Format angka desimal ala Indonesia, contoh: "82,5" atau "82". */
export function formatDecimal(value: number): string {
  return value.toLocaleString("id-ID", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  });
}

/** Format angka persen ala Indonesia, contoh: "91,7%". */
export function formatPercent(value: number): string {
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
}

/** Format tanggal penuh, contoh: "Jumat, 4 September 2026". */
export function longDateLabel(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
