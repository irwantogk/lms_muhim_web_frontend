import type { AttendanceStatus } from "../types.ts";
import { schedules, subjects, users } from "./db.ts";

export interface AttendanceHistoryEntry {
  id: string;
  dateIso: string;
  dayLabel: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  status: AttendanceStatus;
  scannedAt: string;
}

const DAY_LABELS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const CLASS_ID = "c1";

interface Slot {
  subjectId: string;
  teacherId: string;
  start: string;
  end: string;
}

const slots: Slot[] = (() => {
  const seen = new Set<string>();
  const result: Slot[] = [];
  for (const row of schedules) {
    if (row.classId !== CLASS_ID) continue;
    if (seen.has(row.subjectId)) continue;
    seen.add(row.subjectId);
    result.push({
      subjectId: row.subjectId,
      teacherId: row.teacherId,
      start: row.start,
      end: row.end,
    });
  }
  return result;
})();

function subjectName(subjectId: string): { code: string; name: string } {
  const subject = subjects.find((s) => s.id === subjectId);
  return { code: subject?.code ?? "-", name: subject?.name ?? subjectId };
}

function teacherName(teacherId: string): string {
  return users.find((u) => u.id === teacherId)?.full_name ?? "-";
}

function statusFromSeed(seed: number): AttendanceStatus {
  const value = seed % 100;
  if (value < 80) return "hadir";
  if (value < 88) return "terlambat";
  if (value < 94) return "izin";
  return "sakit";
}

function seedOf(date: Date, index: number): number {
  const total = date.getDate() * 31 + (date.getMonth() + 1) * 17 + index * 13;
  return Math.abs(Math.sin(total) * 10000) % 1_000_000;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${
    pad(date.getDate())
  }`;
}

function toTimeLabel(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Data tiruan riwayat kehadiran murid (kelas XII IPA 1) — N hari sekolah
 * terakhir. Status ditentukan deterministik agar tampilan stabil antar render.
 */
export function generateAttendanceHistory(
  count = 40,
): AttendanceHistoryEntry[] {
  const entries: AttendanceHistoryEntry[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  let index = 0;

  while (entries.length < count && index < 500) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) {
      const slot = slots[index % slots.length];
      const subject = subjectName(slot.subjectId);
      const status = statusFromSeed(seedOf(cursor, index));
      const scannedMinutes = new Date(cursor);
      scannedMinutes.setHours(
        Number(slot.start.split(":")[0] ?? 8),
        Number(slot.start.split(":")[1] ?? 0) +
          (status === "terlambat" ? 12 : 2),
        0,
        0,
      );

      entries.push({
        id: `hist-${toIso(cursor)}-${index}`,
        dateIso: toIso(cursor),
        dayLabel: DAY_LABELS[weekday] ?? "-",
        subjectCode: subject.code,
        subjectName: subject.name,
        teacherName: teacherName(slot.teacherId),
        startTime: slot.start,
        endTime: slot.end,
        status,
        scannedAt: toTimeLabel(scannedMinutes),
      });
      index += 1;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return entries;
}
