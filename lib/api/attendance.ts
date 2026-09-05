import type {
  AttendanceRecordItem,
  AttendanceSnapshot,
  AttendanceToday,
  ClassSessionItem,
} from "../types.ts";
import {
  classes,
  classStudentCounts,
  classStudents,
  users,
} from "../mock/db.ts";
import { getTodaySchedule } from "./schedules.ts";

const STATUS_POOL: AttendanceToday[] = [
  "hadir",
  "hadir",
  "terlambat",
  "hadir",
  "izin",
];

function stableHash(value: string): number {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }
  return hash;
}

function statusFor(scheduleId: string): AttendanceToday {
  return STATUS_POOL[stableHash(scheduleId) % STATUS_POOL.length];
}

function sessionCode(scheduleId: string): string {
  return "ATD" + String(stableHash(scheduleId) % 1000).padStart(3, "0");
}

export function getStudentClassId(studentId: string): string | null {
  return classStudents.find((cs) => cs.studentId === studentId)?.classId ??
    null;
}

/** Ringkasan kehadiran & jadwal seorang murid hari ini. */
export function getMuridAttendance(studentId: string): {
  records: AttendanceRecordItem[];
  summary: AttendanceSnapshot;
} {
  const classId = getStudentClassId(studentId);
  const schedule = classId ? getTodaySchedule({ classId }) : [];

  const records: AttendanceRecordItem[] = schedule.map((item) => {
    const status = statusFor(item.id);
    return {
      id: item.id,
      subjectCode: item.subjectCode,
      subjectName: item.subjectName,
      className: item.className,
      time: `${item.startTime}-${item.endTime}`,
      status,
    };
  });

  const count = (target: AttendanceToday) =>
    records.filter((r) => r.status === target).length;

  const summary: AttendanceSnapshot = {
    overall: records.length === 0
      ? "belum"
      : count("hadir") > 0
      ? "hadir"
      : records[0].status,
    hadir: count("hadir"),
    terlambat: count("terlambat"),
    izin: count("izin"),
    sakit: count("sakit"),
    totalSessions: records.length,
  };

  return { records, summary };
}

/** Sesi kelas yang diampu guru hari ini beserta rekap presensi. */
export function getTeacherSessions(teacherId: string): ClassSessionItem[] {
  const schedule = getTodaySchedule({ teacherId });
  return schedule.map((item) => {
    const total = classStudentCounts[item.className] ?? 0;
    const late = stableHash(item.id) % 2;
    const present = total - late;
    return {
      id: item.id,
      className: item.className,
      subjectName: item.subjectName,
      subjectCode: item.subjectCode,
      time: `${item.startTime}-${item.endTime}`,
      present,
      total,
      code: sessionCode(item.id),
    };
  });
}

/** Ringkasan kehadiran bulanan (data turian untuk halaman orang tua). */
export function getMonthlyAttendance(): AttendanceSnapshot {
  const snapshot: AttendanceSnapshot = {
    overall: "hadir",
    hadir: 18,
    terlambat: 2,
    izin: 1,
    sakit: 1,
    totalSessions: 22,
  };
  return snapshot;
}

export function studentClassName(studentId: string): string {
  const classId = getStudentClassId(studentId);
  return classes.find((c) => c.id === classId)?.name ?? "-";
}

export function studentName(studentId: string): string {
  return users.find((u) => u.id === studentId)?.full_name ?? "-";
}
