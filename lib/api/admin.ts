import type { AdminStatItem, WeeklyTrend } from "../types.ts";
import { classes, subjects, users } from "../mock/db.ts";
import { toDayShort } from "../date.ts";

export function getAdminStats(): AdminStatItem[] {
  const byRole = (role: string) => users.filter((u) => u.role === role).length;

  return [
    {
      label: "Total Pengguna",
      value: users.length,
      hint: `${byRole("admin")} admin`,
      tone: "primary",
    },
    {
      label: "Guru",
      value: byRole("guru"),
      hint: "Pengajar aktif",
      tone: "guru",
    },
    {
      label: "Murid",
      value: byRole("murid"),
      hint: "Terdaftar",
      tone: "murid",
    },
    {
      label: "Orang Tua",
      value: byRole("orang_tua"),
      hint: "Akun terhubung",
      tone: "ortu",
    },
    {
      label: "Kelas",
      value: classes.length,
      hint: "Tahun ajaran 2025/2026",
      tone: "admin",
    },
    {
      label: "Mata Pelajaran",
      value: subjects.length,
      hint: "Diajarkan",
      tone: "primary",
    },
  ];
}

const SEED: Record<"hadir" | "terlambat" | "izin" | "sakit", number[]> = {
  hadir: [128, 141, 132, 146, 139, 133, 122],
  terlambat: [6, 4, 7, 3, 5, 8, 4],
  izin: [3, 2, 4, 2, 3, 5, 2],
  sakit: [2, 1, 3, 1, 2, 4, 1],
};

/** Tren kehadiran sekolah 7 hari terakhir (dihitung dari hari ini mundur). */
export function getWeeklyTrend(): WeeklyTrend[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const result: WeeklyTrend[] = [];

  for (let offset = 6; offset >= 0; offset--) {
    const day = new Date(today.getTime() - offset * 24 * 60 * 60 * 1000);
    const index = (7 - offset) % 7;
    result.push({
      label: toDayShort(day),
      hadir: SEED.hadir[index],
      terlambat: SEED.terlambat[index],
      izin: SEED.izin[index],
      sakit: SEED.sakit[index],
    });
  }

  return result;
}
