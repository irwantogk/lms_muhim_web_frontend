export type Role = "admin" | "guru" | "murid" | "orang_tua";

export const ROLES: readonly Role[] = ["admin", "guru", "murid", "orang_tua"];

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface User {
  id: string;
  full_name: string;
  role: Role;
  email: string;
  photo_url?: string | null;
}

export type AttendanceStatus = "hadir" | "terlambat" | "izin" | "sakit";

export type AttendanceToday = AttendanceStatus | "belum";

export type AssignmentType = "pilihan_ganda" | "esai" | "upload";

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  subtitle: string;
  photoUrl?: string | null;
}

export interface TodayMeta {
  dateLabel: string;
}

export interface ScheduleItem {
  id: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
}

export interface AttendanceRecordItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  className: string;
  time: string;
  status: AttendanceToday;
}

export interface AttendanceSnapshot {
  overall: AttendanceToday;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  totalSessions: number;
}

export interface AssignmentItem {
  id: string;
  title: string;
  subjectName: string;
  className: string;
  type: AssignmentType;
  deadlineIso: string;
  daysLeft: number;
}

export interface GradingItem {
  id: string;
  title: string;
  className: string;
  subjectName: string;
  deadlineIso: string;
  pending: number;
}

export interface ClassSessionItem {
  id: string;
  className: string;
  subjectName: string;
  subjectCode: string;
  time: string;
  present: number;
  total: number;
  code: string;
}

export interface QuickLink {
  id: string;
  label: string;
  description: string;
  monogram: string;
  tone: RoleTone;
  href: string;
}

export type RoleTone = "admin" | "guru" | "murid" | "ortu" | "primary";

export interface ChildOverviewItem {
  id: string;
  name: string;
  className: string;
  today: AttendanceSnapshot;
  monthly: AttendanceSnapshot;
  avgScore: number;
  taskDone: number;
  taskTotal: number;
}

export interface AdminStatItem {
  label: string;
  value: number;
  hint: string;
  tone: RoleTone;
}

export interface WeeklyTrend {
  label: string;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
}

export interface MuridData {
  attendance: AttendanceRecordItem[];
  attendanceSummary: AttendanceSnapshot;
  assignments: AssignmentItem[];
}

export interface GuruData {
  sessions: ClassSessionItem[];
  toGrade: GradingItem[];
}

export interface OrtuData {
  children: ChildOverviewItem[];
}

export interface AdminData {
  stats: AdminStatItem[];
  weeklyTrend: WeeklyTrend[];
}

export interface DashboardData {
  user: SessionUser;
  today: TodayMeta;
  greeting: string;
  role: Role;
  quickLinks: QuickLink[];
  murid?: MuridData;
  guru?: GuruData;
  ortu?: OrtuData;
  admin?: AdminData;
}
