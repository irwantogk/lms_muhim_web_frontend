import type { DashboardData, OrtuData, Role } from "../types.ts";
import { getSessionUser } from "./auth.ts";
import {
  getMonthlyAttendance,
  getMuridAttendance,
  getStudentClassId,
  getTeacherSessions,
  studentClassName,
  studentName,
} from "./attendance.ts";
import { getGradingQueue, getUpcomingAssignments } from "./assignments.ts";
import { getAdminStats, getWeeklyTrend } from "./admin.ts";
import { parentStudents } from "../mock/db.ts";
import { greetingForHour, toDateLabel } from "../date.ts";
import { quickLinksFor } from "../quickLinks.ts";

function buildParentData(parentId: string): OrtuData {
  const children = parentStudents
    .filter((ps) => ps.parentId === parentId)
    .map((ps) => ({
      id: ps.studentId,
      name: studentName(ps.studentId),
      className: studentClassName(ps.studentId),
      monthly: getMonthlyAttendance(),
      today: {
        overall: "belum" as const,
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        totalSessions: 0,
      },
      avgScore: 86,
      taskDone: 12,
      taskTotal: 14,
    }));

  return { children };
}

/**
 * Orkestrator Beranda — menggabungkan data mock tiap modul sesuai peran.
 * Saat backend Elysia tersedia, fungsi ini diganti pemanggilan fetch terpisah.
 */
export function getDashboard(role: Role): DashboardData {
  const user = getSessionUser(role);
  const now = new Date();

  const data: DashboardData = {
    user,
    role,
    greeting: greetingForHour(now),
    today: { dateLabel: toDateLabel(now) },
    quickLinks: quickLinksFor(role),
  };

  switch (role) {
    case "murid": {
      const { records, summary } = getMuridAttendance(user.id);
      data.murid = {
        attendance: records,
        attendanceSummary: summary,
        assignments: getUpcomingAssignments(
          getStudentClassId(user.id) ?? "",
          3,
        ),
      };
      break;
    }
    case "guru":
      data.guru = {
        sessions: getTeacherSessions(user.id),
        toGrade: getGradingQueue(user.id),
      };
      break;
    case "orang_tua":
      data.ortu = buildParentData(user.id);
      break;
    case "admin":
      data.admin = {
        stats: getAdminStats(),
        weeklyTrend: getWeeklyTrend(),
      };
      break;
  }

  return data;
}
