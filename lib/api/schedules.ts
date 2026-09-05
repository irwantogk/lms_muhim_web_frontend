import type { ScheduleItem } from "../types.ts";
import {
  classes,
  classSubjectTeacher,
  schedules,
  subjects,
  users,
} from "../mock/db.ts";

export interface TodayFilter {
  classId?: string;
  teacherId?: string;
}

const DAY_ORDER = [1, 2, 3, 4, 5] as const;

const DAY_LABEL: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
};

function subjectOf(subjectId: string): { code: string; name: string } {
  const subject = subjects.find((s) => s.id === subjectId);
  return { code: subject?.code ?? "-", name: subject?.name ?? subjectId };
}

function teacherOf(teacherId: string): string {
  return users.find((u) => u.id === teacherId)?.full_name ?? "-";
}

export function classNameById(classId: string): string {
  return classes.find((c) => c.id === classId)?.name ?? classId;
}

export function listClasses(): Array<{ id: string; name: string }> {
  return classes.map((c) => ({ id: c.id, name: c.name }));
}

export function classesOfTeacher(teacherId: string): string[] {
  return [
    ...new Set(
      classSubjectTeacher
        .filter((cst) => cst.teacherId === teacherId)
        .map((cst) => cst.classId),
    ),
  ];
}

/**
 * Mock GET /schedules?day=today
 * Filter relasi guru->kelas mengikuti class_subject_teacher (pengampu).
 */
export function getTodaySchedule(filter: TodayFilter = {}): ScheduleItem[] {
  const weekday = new Date().getDay();
  const dayRows = schedules.filter((row) => row.dayOfWeek === weekday);

  const rows = dayRows.filter((row) => {
    if (filter.classId && row.classId !== filter.classId) return false;
    if (filter.teacherId) {
      const teaches = classSubjectTeacher.some((cst) =>
        cst.classId === row.classId &&
        cst.subjectId === row.subjectId &&
        cst.teacherId === filter.teacherId
      );
      if (!teaches) return false;
    }
    return true;
  });

  return rows.map((row) => ({
    id: row.id,
    className: classNameById(row.classId),
    subjectCode: subjectOf(row.subjectId).code,
    subjectName: subjectOf(row.subjectId).name,
    teacherName: teacherOf(row.teacherId),
    startTime: row.start,
    endTime: row.end,
  }));
}

export interface WeeklySlot {
  scheduleId: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  start: string;
  end: string;
}

export interface WeekDay {
  day: number;
  label: string;
  short: string;
  isToday: boolean;
  slots: WeeklySlot[];
}

/** Jadwal mingguan sebuah kelas (Senin–Jumat) dari data contoh. */
export function getWeekSchedule(classId: string): WeekDay[] {
  const today = new Date().getDay();
  return DAY_ORDER.map((day) => {
    const slots: WeeklySlot[] = schedules
      .filter((row) => row.classId === classId && row.dayOfWeek === day)
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((row) => ({
        scheduleId: row.id,
        subjectCode: subjectOf(row.subjectId).code,
        subjectName: subjectOf(row.subjectId).name,
        teacherName: teacherOf(row.teacherId),
        start: row.start,
        end: row.end,
      }));

    const label = DAY_LABEL[day] ?? "-";
    return {
      day,
      label,
      short: label.slice(0, 3),
      isToday: day === today,
      slots,
    };
  });
}
