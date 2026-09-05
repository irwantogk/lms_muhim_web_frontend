import type { AssignmentItem, GradingItem } from "../types.ts";
import { assignments, classes, subjects, submissions } from "../mock/db.ts";
import { addDaysIso, daysLeft } from "../date.ts";

function subjectName(subjectId: string): string {
  return subjects.find((s) => s.id === subjectId)?.name ?? subjectId;
}

function className(classId: string): string {
  return classes.find((c) => c.id === classId)?.name ?? classId;
}

/** Tugas terbuka sebuah kelas, diurutkan dari tenggat terdekat. */
export function getUpcomingAssignments(
  classId: string,
  limit = 3,
): AssignmentItem[] {
  const rows = assignments
    .filter((a) => a.classId === classId)
    .map((a) => ({
      id: a.id,
      title: a.title,
      subjectName: subjectName(a.subjectId),
      className: className(a.classId),
      type: a.type,
      deadlineIso: addDaysIso(a.daysAhead),
      daysLeft: a.daysAhead,
    }))
    .sort((x, y) => x.deadlineIso.localeCompare(y.deadlineIso));

  return rows.slice(0, limit);
}

/** Antrean koreksi untuk guru: tugas yang sudah ada kiriman belum dinilai. */
export function getGradingQueue(teacherId: string): GradingItem[] {
  return assignments
    .filter((a) => a.teacherId === teacherId)
    .map((a) => {
      const pending = submissions.filter(
        (s) => s.assignmentId === a.id && !s.graded,
      ).length;
      return {
        id: a.id,
        title: a.title,
        className: className(a.classId),
        subjectName: subjectName(a.subjectId),
        deadlineIso: addDaysIso(a.daysAhead),
        pending,
      };
    })
    .filter((a) => a.pending > 0);
}

/** Utilitas label jenis tugas agar dipakai komponen. */
export function assignmentTypeLabel(type: AssignmentItem["type"]): string {
  switch (type) {
    case "pilihan_ganda":
      return "Pilihan Ganda";
    case "esai":
      return "Esai";
    case "upload":
      return "Unggah File";
  }
}

export { daysLeft };
