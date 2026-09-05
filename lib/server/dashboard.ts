import type {
  AssignmentItem,
  AttendanceRecordItem,
  AttendanceToday,
  AuthUser,
  DashboardData,
  GradingItem,
  GuruData,
  MuridData,
  Role,
  SessionUser,
} from "../types.ts";
import { greetingForHour, toDateLabel } from "../date.ts";
import { quickLinksFor } from "../quickLinks.ts";
import { getDashboardData } from "./backend.ts";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  guru: "Guru",
  murid: "Murid",
  orang_tua: "Orang Tua",
};

/** Ringkasan profil untuk UI dari identitas terautentikasi. */
export function sessionUserOf(auth: AuthUser): SessionUser {
  return {
    id: auth.id,
    name: auth.name,
    role: auth.role,
    subtitle: auth.email || ROLE_LABEL[auth.role],
    photoUrl: null,
  };
}

export function roleOf(value: string): Role | null {
  const roles: Role[] = ["admin", "guru", "murid", "orang_tua"];
  return roles.includes(value as Role) ? (value as Role) : null;
}

// ---------------------------------------------------------------------------
// Tipe respons server (ringkasan murid & guru)
// ---------------------------------------------------------------------------
interface ServerMuridRecord {
  scheduleId: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  status: AttendanceToday;
}

interface ServerMurid {
  student: { className: string };
  attendance: {
    overall: AttendanceToday;
    hadir: number;
    terlambat: number;
    izin: number;
    sakit: number;
    totalSessions: number;
  };
  records: ServerMuridRecord[];
  assignments: Array<{
    id: string;
    title: string;
    className: string;
    subjectName: string;
    type: AssignmentItem["type"];
    deadline: string;
    daysLeft: number;
  }>;
}

interface ServerGuruSession {
  scheduleId: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  present: number;
  total: number;
  code: string | null;
}

interface ServerGuru {
  sessions: ServerGuruSession[];
  toGrade: Array<{
    assignmentId: string;
    title: string;
    className: string;
    subjectName: string;
    deadline: string;
    pending: number;
  }>;
}

interface ServerSnapshot {
  overall: AttendanceToday;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  totalSessions: number;
}

interface ServerOrtuChild {
  id: string;
  name: string;
  className: string;
  today: ServerSnapshot;
  monthly: ServerSnapshot;
  avgScore: number;
  taskDone: number;
  taskTotal: number;
}

interface ServerOrtu {
  children: ServerOrtuChild[];
}

function adaptMurid(raw: unknown): Pick<DashboardData, "murid"> {
  const server = raw as ServerMurid;
  const studentClassName = server.student.className ?? "";

  const attendance: AttendanceRecordItem[] = server.records.map((record) => ({
    id: record.scheduleId,
    subjectCode: record.subjectCode,
    subjectName: record.subjectName,
    className: studentClassName,
    time: `${record.startTime}-${record.endTime}`,
    status: record.status,
  }));

  const assignments: AssignmentItem[] = server.assignments.map((task) => ({
    id: task.id,
    title: task.title,
    subjectName: task.subjectName,
    className: task.className,
    type: task.type,
    deadlineIso: task.deadline,
    daysLeft: task.daysLeft,
  }));

  const murid: MuridData = {
    attendance,
    attendanceSummary: {
      overall: server.attendance.overall,
      hadir: server.attendance.hadir,
      terlambat: server.attendance.terlambat,
      izin: server.attendance.izin,
      sakit: server.attendance.sakit,
      totalSessions: server.attendance.totalSessions,
    },
    assignments,
  };

  return { murid };
}

function adaptGuru(raw: unknown): Pick<DashboardData, "guru"> {
  const server = raw as ServerGuru;

  const sessions: GuruData["sessions"] = server.sessions.map((session) => ({
    id: session.scheduleId,
    className: session.className,
    subjectCode: session.subjectCode,
    subjectName: session.subjectName,
    time: `${session.startTime}-${session.endTime}`,
    present: session.present,
    total: session.total,
    code: session.code ?? "",
  }));

  const toGrade: GradingItem[] = server.toGrade.map((item) => ({
    id: item.assignmentId,
    title: item.title,
    className: item.className,
    subjectName: item.subjectName,
    deadlineIso: item.deadline,
    pending: item.pending,
  }));

  return { guru: { sessions, toGrade } };
}

function adaptOrtu(raw: unknown): Pick<DashboardData, "ortu"> {
  const server = raw as ServerOrtu;
  return {
    ortu: {
      children: server.children.map((child) => ({
        id: child.id,
        name: child.name,
        className: child.className,
        today: { ...child.today },
        monthly: { ...child.monthly },
        avgScore: child.avgScore,
        taskDone: child.taskDone,
        taskTotal: child.taskTotal,
      })),
    },
  };
}
/**
 * Menyusun data Beranda sesuai peran dari API Elysia (semua peran).
 */
export async function buildDashboardData(
  user: AuthUser,
  accessToken: string,
): Promise<DashboardData> {
  const now = new Date();
  const profile = sessionUserOf(user);
  const dateLabel = toDateLabel(now);
  const raw = await getDashboardData(user.role, accessToken);

  let sections: Partial<DashboardData> = {};
  if (user.role === "murid") sections = adaptMurid(raw);
  if (user.role === "guru") sections = adaptGuru(raw);
  if (user.role === "orang_tua") sections = adaptOrtu(raw);
  if (user.role === "admin") sections = adaptAdmin(raw);

  return {
    user: profile,
    role: user.role,
    greeting: greetingForHour(now),
    today: { dateLabel },
    quickLinks: quickLinksFor(user.role),
    ...sections,
  };
}

function adaptAdmin(raw: unknown): Pick<DashboardData, "admin"> {
  const server = raw as DashboardData["admin"];
  return {
    admin: {
      stats: server?.stats ?? [],
      weeklyTrend: server?.weeklyTrend ?? [],
    },
  };
}
