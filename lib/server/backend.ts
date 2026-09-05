import type { AuthUser, Role } from "../types.ts";
import { ROLES } from "../types.ts";

/**
 * Utilitas sisi-server untuk berkomunikasi dengan backend Elysia (LMS API)
 * dan mengelola cookie sesi (access token + refresh token, HttpOnly).
 * File ini TIDAK boleh diimpor dari island (client bundle).
 */

export const API_BASE =
  (Deno.env.get("LMS_API_BASE") ?? "http://localhost:3000")
    .replace(/\/+$/, "");

export const ACCESS_COOKIE = "lms_access";
export const REFRESH_COOKIE = "lms_refresh";
export const USER_COOKIE = "lms_user";

export const ACCESS_MAX_AGE = 15 * 60; // detik (sesuai backend)
export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // detik

const ROLE_SET = new Set<string>(ROLES);

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLE_SET.has(value);
}

export interface BackendUser extends AuthUser {}

export interface TokenPairData {
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
}

// ---------------------------------------------------------------------------
// Cookies
// ---------------------------------------------------------------------------
export function readCookies(req: Request): Record<string, string> {
  const header = req.headers.get("cookie");
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}

export function cookieHeader(
  name: string,
  value: string,
  maxAgeSeconds: number,
): string {
  return [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
    "SameSite=Lax",
    "HttpOnly",
  ].join("; ");
}

export function clearCookieHeader(name: string): string {
  return `${name}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`;
}

// ---------------------------------------------------------------------------
// JWT payload (tanpa verifikasi — hanya untuk penjadwalan refresh)
// ---------------------------------------------------------------------------
export interface AccessPayload {
  sub?: string;
  role?: string;
  sessionId?: string;
  exp?: number;
}

export function decodeAccessToken(token: string): AccessPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as AccessPayload;
  } catch {
    return null;
  }
}

export function accessTokenExpiringSoon(
  token: string,
  skewSeconds = 45,
): boolean {
  const payload = decodeAccessToken(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

// ---------------------------------------------------------------------------
// User cookie (agar layout tahu nama/peran tanpa decode berulang)
// ---------------------------------------------------------------------------
export function encodeUserCookie(user: BackendUser): string {
  return JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}

export function parseUserCookie(raw: string | undefined): BackendUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<BackendUser>;
    if (
      typeof parsed.id === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.email === "string" &&
      isRole(parsed.role)
    ) {
      return {
        id: parsed.id,
        name: parsed.name,
        email: parsed.email,
        role: parsed.role,
      };
    }
  } catch {
    // abaikan cookie rusak
  }
  return null;
}

// ---------------------------------------------------------------------------
// Backend API
// ---------------------------------------------------------------------------
interface BackendError {
  error?: { code?: string; message?: string };
}

type LoginResult =
  | { ok: true; data: TokenPairData }
  | { ok: false; message: string };

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const error = json as BackendError | null;
    throw new Error(
      error?.error?.message ?? `Backend ${path} gagal (${response.status})`,
    );
  }
  return json as T;
}

export async function loginRequest(
  identifier: string,
  password: string,
): Promise<LoginResult> {
  try {
    const json = await postJson<{ success: boolean; data: TokenPairData }>(
      "/auth/login",
      { identifier, password },
    );
    if (
      json.success && json.data && json.data.user && isRole(json.data.user.role)
    ) {
      return { ok: true, data: json.data };
    }
    return { ok: false, message: "Respons login tidak dikenal" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error
        ? error.message
        : "Gagal menghubungi server",
    };
  }
}

export async function refreshRequest(
  refreshToken: string,
): Promise<LoginResult> {
  try {
    const json = await postJson<{ success: boolean; data: TokenPairData }>(
      "/auth/refresh",
      { refreshToken },
    );
    if (
      json.success && json.data && json.data.user && isRole(json.data.user.role)
    ) {
      return { ok: true, data: json.data };
    }
    return { ok: false, message: "Sesi kedaluwarsa, silakan masuk kembali" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Sesi kedaluwarsa",
    };
  }
}

export async function getDashboardData(
  role: Role,
  accessToken: string,
): Promise<unknown> {
  const response = await fetch(`${API_BASE}/dashboard/${role}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const error = json as BackendError | null;
    throw new Error(
      error?.error?.message ??
        `Gagal memuat data dashboard (${response.status})`,
    );
  }

  const body = json as { success: boolean; data: unknown } | null;
  return body?.data;
}

// ---------------------------------------------------------------------------
// Attendance (guru)
// ---------------------------------------------------------------------------
export interface AttendanceOption {
  classId: string;
  className: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
}

export interface AttendanceSession {
  id: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  code: string;
  createdAt: string;
  expiresAt: string;
}

async function authedJson<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const error = json as BackendError | null;
    throw new ApiError(
      error?.error?.code ?? `HTTP_${response.status}`,
      error?.error?.message ?? `Permintaan backend gagal (${response.status})`,
    );
  }
  return json as T;
}

export class ApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export async function getAttendanceOptions(
  accessToken: string,
): Promise<AttendanceOption[]> {
  const json = await authedJson<{ data: { options: AttendanceOption[] } }>(
    "/attendance/options",
    accessToken,
  );
  return json.data.options;
}

export async function getTodaySessions(
  accessToken: string,
): Promise<AttendanceSession[]> {
  const json = await authedJson<{ data: { sessions: AttendanceSession[] } }>(
    "/attendance/sessions",
    accessToken,
  );
  return json.data.sessions;
}

export async function createAttendanceSession(
  accessToken: string,
  body: { classId: string; subjectId: string; validMinutes: number },
): Promise<AttendanceSession> {
  const json = await authedJson<{ data: AttendanceSession }>(
    "/attendance/sessions",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
  return json.data;
}

export async function closeAttendanceSession(
  accessToken: string,
  sessionId: string,
): Promise<AttendanceSession> {
  const json = await authedJson<{ data: AttendanceSession }>(
    `/attendance/sessions/${sessionId}/close`,
    accessToken,
    { method: "POST" },
  );
  return json.data;
}

export interface ScanResult {
  className: string;
  subjectCode: string;
  subjectName: string;
  code: string;
  status: "hadir";
  scannedAt: string;
}

export async function scanAttendanceSession(
  accessToken: string,
  code: string,
): Promise<ScanResult> {
  const json = await authedJson<{ data: ScanResult }>(
    "/attendance/scan",
    accessToken,
    { method: "POST", body: JSON.stringify({ code }) },
  );
  return json.data;
}

// ---------------------------------------------------------------------------
// Schedules (jadwal mingguan)
// ---------------------------------------------------------------------------
export interface ScheduleClassOption {
  id: string;
  name: string;
}

export interface ScheduleSession {
  classId: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleDay {
  day: number;
  label: string;
  isToday: boolean;
  sessions: ScheduleSession[];
}

export interface WeeklyScheduleData {
  currentClassId: string | null;
  currentClassName: string | null;
  availableClasses: ScheduleClassOption[];
  days: ScheduleDay[];
}
export async function getWeeklySchedule(
  accessToken: string,
  classId?: string,
): Promise<WeeklyScheduleData> {
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  const json = await authedJson<{ data: WeeklyScheduleData }>(
    `/schedules/weekly${query}`,
    accessToken,
  );
  return json.data;
}

// ---------------------------------------------------------------------------
// Riwayat kehadiran
// ---------------------------------------------------------------------------
export interface AttendanceSummary {
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  total: number;
  presencePercent: number;
}

export interface StudentHistoryEntry {
  id: string;
  dateIso: string;
  dayLabel: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  status: "hadir" | "terlambat" | "izin" | "sakit";
  scannedAt: string;
}

export interface StudentHistoryResponse {
  student: { id: string; name: string; className: string };
  summary: AttendanceSummary;
  history: StudentHistoryEntry[];
}

export async function getStudentHistory(
  accessToken: string,
  days?: number,
): Promise<StudentHistoryResponse> {
  const query = days ? `?days=${Math.max(1, Math.min(365, days))}` : "";
  const json = await authedJson<{ data: StudentHistoryResponse }>(
    `/attendance/history/murid${query}`,
    accessToken,
  );
  return json.data;
}

// ---------------------------------------------------------------------------
// Assignments (tugas)
// ---------------------------------------------------------------------------
export type TaskKind = "pilihan_ganda" | "esai" | "upload" | "campuran";

export type TaskQuestion =
  | {
    kind?: "pilihan_ganda";
    text: string;
    options: string[];
    multiple?: boolean;
    correct: number | number[];
  }
  | { kind: "esai"; text: string };

export interface AssignmentApiItem {
  id: string;
  className: string;
  classId: string;
  subjectCode: string;
  subjectName: string;
  title: string;
  instruction: string;
  type: TaskKind;
  questions: TaskQuestion[] | null;
  deadline: string;
  createdAt: string;
}

export interface AssignmentsListResponse {
  availableClasses: Array<{ id: string; name: string }>;
  currentClassId: string | null;
  assignments: AssignmentApiItem[];
}

export async function getAssignmentsList(
  accessToken: string,
  classId?: string,
): Promise<AssignmentsListResponse> {
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  const json = await authedJson<{ data: AssignmentsListResponse }>(
    `/assignments${query}`,
    accessToken,
  );
  return json.data;
}

export interface SubmissionApiItem {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  answer: Record<string, unknown> | null;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
}

export async function getSubmissionsList(
  accessToken: string,
  assignmentId: string,
): Promise<SubmissionApiItem[]> {
  const json = await authedJson<{ data: SubmissionApiItem[] }>(
    `/assignments/${encodeURIComponent(assignmentId)}/submissions`,
    accessToken,
  );
  return json.data;
}

export async function submitAssignmentAnswer(
  accessToken: string,
  assignmentId: string,
  body: { answers?: number[]; text?: string; fileName?: string },
): Promise<SubmissionApiItem> {
  const json = await authedJson<{ data: SubmissionApiItem }>(
    `/assignments/${encodeURIComponent(assignmentId)}/submissions`,
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
  return json.data;
}

export async function createAssignmentRequest(
  accessToken: string,
  body: {
    classId: string;
    subjectId: string;
    title: string;
    instruction: string;
    type: TaskKind;
    deadline: string;
    questions?: TaskQuestion[];
  },
): Promise<AssignmentApiItem> {
  const json = await authedJson<{ data: AssignmentApiItem }>(
    "/assignments",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
  return json.data;
}

export async function gradeAssignmentSubmission(
  accessToken: string,
  assignmentId: string,
  submissionId: string,
  body: { score: number; feedback?: string },
): Promise<SubmissionApiItem> {
  const json = await authedJson<{ data: SubmissionApiItem }>(
    `/assignments/${encodeURIComponent(assignmentId)}/submissions/${
      encodeURIComponent(submissionId)
    }/grade`,
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
  return json.data;
}

export interface MyGradesResponse {
  summary: { total: number; graded: number; avg: number | null };
  results: Array<{
    submissionId: string;
    assignmentId: string;
    title: string;
    className: string;
    subjectCode: string;
    subjectName: string;
    type: TaskKind;
    deadline: string;
    submittedAt: string;
    score: number | null;
    feedback: string | null;
    gradedAt: string | null;
  }>;
}

export async function getMyGrades(
  accessToken: string,
): Promise<MyGradesResponse> {
  const json = await authedJson<{ data: MyGradesResponse }>(
    "/assignments/me/nilai",
    accessToken,
  );
  return json.data;
}

// ---------------------------------------------------------------------------
// Materi — upload via presigned URL
// ---------------------------------------------------------------------------
export interface PresignResultData {
  key: string;
  method: "PUT";
  uploadUrl: string;
  fileUrl: string;
  type: "pdf" | "video" | "dokumen";
}

export interface MaterialMeta {
  id: string;
  title: string;
  fileUrl: string;
  type: string;
}

export async function presignMaterialUpload(
  accessToken: string,
  body: {
    classId: string;
    subjectId: string;
    fileName: string;
    fileSize: number;
    title?: string;
    description?: string;
  },
): Promise<PresignResultData> {
  const json = await authedJson<{ data: PresignResultData }>(
    "/materials/presign-upload",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
  return json.data;
}

export async function confirmMaterialUpload(
  accessToken: string,
  body: {
    classId: string;
    subjectId: string;
    key: string;
    title?: string;
    description?: string;
  },
): Promise<MaterialMeta> {
  const json = await authedJson<{ data: MaterialMeta }>(
    "/materials",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
  return json.data;
}

export interface MaterialsListItem {
  id: string;
  className: string;
  classId: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  title: string;
  description: string | null;
  content: string | null;
  fileUrl: string;
  type: "pdf" | "video" | "dokumen" | "catatan";
  createdAt: string;
}

export interface MaterialsListResponse {
  availableClasses: Array<{ id: string; name: string }>;
  currentClassId: string | null;
  materials: MaterialsListItem[];
}

export async function getMaterialsList(
  accessToken: string,
  classId?: string,
): Promise<MaterialsListResponse> {
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  const json = await authedJson<{ data: MaterialsListResponse }>(
    `/materials${query}`,
    accessToken,
  );
  return json.data;
}

export async function getMaterialDetail(
  accessToken: string,
  id: string,
): Promise<MaterialsListItem> {
  const json = await authedJson<{ data: MaterialsListItem }>(
    `/materials/${encodeURIComponent(id)}`,
    accessToken,
  );
  return json.data;
}

export async function createMaterialContent(
  accessToken: string,
  body: {
    classId: string;
    subjectId: string;
    title: string;
    description?: string;
    content: string;
  },
): Promise<MaterialsListItem> {
  const json = await authedJson<{ data: MaterialsListItem }>(
    "/materials/content",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
  return json.data;
}

// ---------------------------------------------------------------------------
// Forum
// ---------------------------------------------------------------------------
export interface ForumTopicApi {
  id: string;
  className: string;
  classId: string;
  subjectCode: string;
  subjectName: string;
  authorName: string;
  authorRole: "admin" | "guru" | "murid" | "orang_tua";
  title: string;
  body: string;
  isHidden: boolean;
  replies: number;
  createdAt: string;
}

export interface ForumReplyApi {
  id: string;
  authorName: string;
  authorRole: "admin" | "guru" | "murid" | "orang_tua";
  body: string;
  isHidden: boolean;
  createdAt: string;
}

export interface ForumMeta {
  classes: Array<{ id: string; name: string }>;
  subjects: Array<{ id: string; code: string; name: string }>;
}

export async function getForumMeta(
  accessToken: string,
): Promise<ForumMeta> {
  const json = await authedJson<{ data: ForumMeta }>(
    "/forum/meta",
    accessToken,
  );
  return json.data;
}

export async function getForumTopics(
  accessToken: string,
  classId?: string,
): Promise<{
  availableClasses: Array<{ id: string; name: string }>;
  currentClassId: string | null;
  topics: ForumTopicApi[];
}> {
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  const json = await authedJson<{
    data: {
      availableClasses: Array<{ id: string; name: string }>;
      currentClassId: string | null;
      topics: ForumTopicApi[];
    };
  }>(`/forum/topics${query}`, accessToken);
  return json.data;
}

export async function getForumTopicDetail(
  accessToken: string,
  id: string,
): Promise<{ topic: ForumTopicApi; replies: ForumReplyApi[] }> {
  const json = await authedJson<{
    data: { topic: ForumTopicApi; replies: ForumReplyApi[] };
  }>(`/forum/topics/${encodeURIComponent(id)}`, accessToken);
  return json.data;
}

export async function createForumTopicRequest(
  accessToken: string,
  body: {
    classId: string;
    subjectId: string;
    title: string;
    content: string;
  },
): Promise<ForumTopicApi> {
  const json = await authedJson<{ data: ForumTopicApi }>(
    "/forum/topics",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        classId: body.classId,
        subjectId: body.subjectId,
        title: body.title,
        body: body.content,
      }),
    },
  );
  return json.data;
}

export async function createForumReplyRequest(
  accessToken: string,
  topicId: string,
  body: string,
): Promise<ForumReplyApi> {
  const json = await authedJson<{ data: ForumReplyApi }>(
    `/forum/topics/${encodeURIComponent(topicId)}/replies`,
    accessToken,
    { method: "POST", body: JSON.stringify({ body }) },
  );
  return json.data;
}

export function forumModerate(
  accessToken: string,
  input: {
    kind: "topic" | "reply";
    id: string;
    action: "hide" | "show" | "delete";
  },
): Promise<unknown> {
  const plural = input.kind === "topic" ? "topics" : "replies";
  if (input.action === "delete") {
    return authedJson<unknown>(
      `/forum/${plural}/${encodeURIComponent(input.id)}`,
      accessToken,
      { method: "DELETE" },
    );
  }
  return authedJson<unknown>(
    `/forum/${plural}/${encodeURIComponent(input.id)}/hidden`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ hidden: input.action === "hide" }),
    },
  );
}

// ---------------------------------------------------------------------------
// Laporan & Progres — rekap nilai & kehadiran (guru/admin)
// ---------------------------------------------------------------------------
export interface RekapApiRow {
  classId: string;
  className: string;
  subjectCode: string;
  subjectName: string;
}

export interface RekapNilaiApiRow extends RekapApiRow {
  taskCount: number;
  gradedCount: number;
  avg: number | null;
  highest: number | null;
  lowest: number | null;
}

export interface RekapAbsenApiRow extends RekapApiRow {
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  opportunities: number;
  presencePercent: number;
}

export interface RekapReportApiData {
  availableClasses: Array<{ id: string; name: string }>;
  currentClassId: string | null;
  nilai: RekapNilaiApiRow[];
  kehadiran: RekapAbsenApiRow[];
}

export async function getRekapReport(
  accessToken: string,
  role: "guru" | "admin",
  query?: { classId?: string; subjectCode?: string; days?: number },
): Promise<RekapReportApiData> {
  const params = new URLSearchParams();
  if (query?.classId) params.set("classId", query.classId);
  if (query?.subjectCode) params.set("subjectCode", query.subjectCode);
  if (query?.days) params.set("days", String(query.days));
  const search = params.toString();
  const path = `/reports/rekap/${role}${search ? `?${search}` : ""}`;
  const json = await authedJson<{ data: RekapReportApiData }>(
    path,
    accessToken,
  );
  return json.data;
}

// ---------------------------------------------------------------------------
// Laporan & Progres — progres belajar (murid / orang tua)
// ---------------------------------------------------------------------------
export interface ProgressStudentRef {
  id: string;
  name: string;
  className: string;
}

export interface ProgressClassRef {
  id: string;
  name: string;
}

export interface ProgressMapelApi {
  subjectCode: string;
  subjectName: string;
  totalTasks: number;
  doneTasks: number;
  gradedTasks: number;
  avgScore: number | null;
}

export interface ProgressOverviewApi {
  avgScore: number | null;
  totalTasks: number;
  doneTasks: number;
  gradedTasks: number;
}

export interface ProgressPresenceApi {
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  opportunities: number;
  presencePercent: number;
}

export interface ProgressGradeApi {
  submissionId: string;
  assignmentId: string;
  title: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  type: TaskKind;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
}

export interface ProgressHistoryApi {
  id: string;
  dateIso: string;
  dayLabel: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  status: "hadir" | "terlambat" | "izin" | "sakit";
  scannedAt: string;
}

export interface ProgressReportApiData {
  class: ProgressClassRef;
  overview: ProgressOverviewApi;
  presence: ProgressPresenceApi;
  mapel: ProgressMapelApi[];
  grades: ProgressGradeApi[];
  history: ProgressHistoryApi[];
}

export interface MuridProgressReportApiData extends ProgressReportApiData {
  student: ProgressStudentRef;
}

export async function getMuridProgressReport(
  accessToken: string,
  query?: { days?: number },
): Promise<MuridProgressReportApiData> {
  const params = new URLSearchParams();
  if (query?.days) params.set("days", String(query.days));
  const search = params.toString();
  const path = `/reports/progress/murid${search ? `?${search}` : ""}`;
  const json = await authedJson<{ data: MuridProgressReportApiData }>(
    path,
    accessToken,
  );
  return json.data;
}

export interface OrtuProgressReportApiData extends ProgressReportApiData {
  children: ProgressStudentRef[];
  current: ProgressStudentRef;
}

export interface PantauanChildApi {
  id: string;
  name: string;
  className: string;
  today: ProgressPresenceApi;
  overview: ProgressOverviewApi;
  presence: ProgressPresenceApi;
  mapel: ProgressMapelApi[];
  grades: ProgressGradeApi[];
  history: ProgressHistoryApi[];
}

export interface PantauanOrtuApiData {
  children: PantauanChildApi[];
}

export async function getOrtuPantauan(
  accessToken: string,
  query?: { days?: number },
): Promise<PantauanOrtuApiData> {
  const params = new URLSearchParams();
  if (query?.days) params.set("days", String(query.days));
  const search = params.toString();
  const path = `/reports/pantauan/orang-tua${search ? `?${search}` : ""}`;
  const json = await authedJson<{ data: PantauanOrtuApiData }>(
    path,
    accessToken,
  );
  return json.data;
}

// ---------------------------------------------------------------------------
// Kelola data sekolah — kelas & mapel (admin)
// ---------------------------------------------------------------------------
export interface AdminClass {
  id: string;
  name: string;
  grade: number;
  academicYear: string;
  studentCount: number;
  subjectCount: number;
}

export interface AdminSubject {
  id: string;
  code: string;
  name: string;
  usedCount: number;
}

export async function getAdminClasses(
  accessToken: string,
): Promise<AdminClass[]> {
  const json = await authedJson<{ data: AdminClass[] }>(
    "/kelola/classes",
    accessToken,
  );
  return json.data;
}

export async function createAdminClass(
  accessToken: string,
  body: { name: string; grade: number; academicYear: string },
): Promise<AdminClass> {
  const json = await authedJson<{ data: AdminClass }>(
    "/kelola/classes",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
  return json.data;
}

export async function updateAdminClass(
  accessToken: string,
  id: string,
  body: { name: string; grade: number; academicYear: string },
): Promise<AdminClass> {
  const json = await authedJson<{ data: AdminClass }>(
    `/kelola/classes/${encodeURIComponent(id)}`,
    accessToken,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return json.data;
}

export async function deleteAdminClass(
  accessToken: string,
  id: string,
): Promise<void> {
  await authedJson<unknown>(
    `/kelola/classes/${encodeURIComponent(id)}`,
    accessToken,
    { method: "DELETE" },
  );
}

export async function getAdminSubjects(
  accessToken: string,
): Promise<AdminSubject[]> {
  const json = await authedJson<{ data: AdminSubject[] }>(
    "/kelola/subjects",
    accessToken,
  );
  return json.data;
}

export async function createAdminSubject(
  accessToken: string,
  body: { code: string; name: string },
): Promise<AdminSubject> {
  const json = await authedJson<{ data: AdminSubject }>(
    "/kelola/subjects",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
  return json.data;
}

export async function updateAdminSubject(
  accessToken: string,
  id: string,
  body: { code: string; name: string },
): Promise<AdminSubject> {
  const json = await authedJson<{ data: AdminSubject }>(
    `/kelola/subjects/${encodeURIComponent(id)}`,
    accessToken,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return json.data;
}

export async function deleteAdminSubject(
  accessToken: string,
  id: string,
): Promise<void> {
  await authedJson<unknown>(
    `/kelola/subjects/${encodeURIComponent(id)}`,
    accessToken,
    { method: "DELETE" },
  );
}

// ---------------------------------------------------------------------------
// Kelola data sekolah — pengguna (admin)
// ---------------------------------------------------------------------------
export interface ManagedUser {
  id: string;
  fullName: string;
  email: string | null;
  nisn: string | null;
  role: Role;
  isActive: boolean;
  photoUrl: string | null;
  createdAt: string;
}

export type ManagedUserFilterRole = "admin" | "guru" | "murid" | "orang_tua";

export interface AdminUserList {
  items: ManagedUser[];
  total: number;
  limit: number;
  offset: number;
}

export async function getAdminUsers(
  accessToken: string,
  query?: {
    role?: ManagedUserFilterRole;
    q?: string;
    status?: "aktif" | "nonaktif";
    limit?: number;
    offset?: number;
  },
): Promise<AdminUserList> {
  const params = new URLSearchParams();
  if (query?.role) params.set("role", query.role);
  if (query?.q) params.set("q", query.q);
  if (query?.status) params.set("status", query.status);
  if (query?.limit !== undefined) params.set("limit", String(query.limit));
  if (query?.offset !== undefined) params.set("offset", String(query.offset));
  const search = params.toString();
  const path = `/kelola/users${search ? `?${search}` : ""}`;
  const json = await authedJson<{ data: AdminUserList }>(path, accessToken);
  return json.data;
}

export async function getAdminUser(
  accessToken: string,
  id: string,
): Promise<ManagedUser> {
  const json = await authedJson<{ data: ManagedUser }>(
    `/kelola/users/${encodeURIComponent(id)}`,
    accessToken,
  );
  return json.data;
}

export async function createAdminUser(
  accessToken: string,
  body: {
    fullName: string;
    email?: string;
    nisn?: string;
    password: string;
    role: Role;
  },
): Promise<ManagedUser> {
  const json = await authedJson<{ data: ManagedUser }>(
    "/kelola/users",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
  return json.data;
}

export async function updateAdminUser(
  accessToken: string,
  id: string,
  body: {
    fullName?: string;
    email?: string;
    nisn?: string;
    password?: string;
    role?: Role;
    isActive?: boolean;
  },
): Promise<ManagedUser> {
  const json = await authedJson<{ data: ManagedUser }>(
    `/kelola/users/${encodeURIComponent(id)}`,
    accessToken,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return json.data;
}

// ---------------------------------------------------------------------------
// Kelola data sekolah — keanggotaan (admin)
// ---------------------------------------------------------------------------
export interface MemberRefApi {
  id: string;
  name: string;
}

export interface TeacherAssignmentApi {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}

export interface StudentMembershipApiData {
  class: MemberRefApi;
  enrolled: MemberRefApi[];
  candidates: MemberRefApi[];
}

export interface TeacherMembershipApiData {
  class: MemberRefApi;
  assignments: TeacherAssignmentApi[];
  availableSubjects: MemberRefApi[];
  teachers: MemberRefApi[];
}

export async function getMembershipStudents(
  accessToken: string,
  classId: string,
): Promise<StudentMembershipApiData> {
  const json = await authedJson<{ data: StudentMembershipApiData }>(
    `/kelola/membership/students?classId=${encodeURIComponent(classId)}`,
    accessToken,
  );
  return json.data;
}

export async function addMembershipStudent(
  accessToken: string,
  classId: string,
  studentId: string,
): Promise<void> {
  await authedJson<unknown>("/kelola/membership/students", accessToken, {
    method: "POST",
    body: JSON.stringify({ classId, studentId }),
  });
}

export async function removeMembershipStudent(
  accessToken: string,
  classId: string,
  studentId: string,
): Promise<void> {
  await authedJson<unknown>(
    `/kelola/membership/students?classId=${
      encodeURIComponent(classId)
    }&studentId=${encodeURIComponent(studentId)}`,
    accessToken,
    { method: "DELETE" },
  );
}

export async function moveMembershipStudent(
  accessToken: string,
  body: { studentId: string; classId: string },
): Promise<void> {
  await authedJson<unknown>("/kelola/membership/students/move", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMembershipTeachers(
  accessToken: string,
  classId: string,
): Promise<TeacherMembershipApiData> {
  const json = await authedJson<{ data: TeacherMembershipApiData }>(
    `/kelola/membership/teachers?classId=${encodeURIComponent(classId)}`,
    accessToken,
  );
  return json.data;
}

export async function addMembershipTeacher(
  accessToken: string,
  body: { classId: string; subjectId: string; teacherId: string },
): Promise<void> {
  await authedJson<unknown>("/kelola/membership/teachers", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function changeMembershipTeacher(
  accessToken: string,
  rowId: string,
  teacherId: string,
): Promise<void> {
  await authedJson<unknown>(
    `/kelola/membership/teachers/${encodeURIComponent(rowId)}`,
    accessToken,
    { method: "PATCH", body: JSON.stringify({ teacherId }) },
  );
}

export async function removeMembershipTeacher(
  accessToken: string,
  rowId: string,
): Promise<void> {
  await authedJson<unknown>(
    `/kelola/membership/teachers/${encodeURIComponent(rowId)}`,
    accessToken,
    { method: "DELETE" },
  );
}

// ---------------------------------------------------------------------------
// Profil & akun (semua peran)
// ---------------------------------------------------------------------------
export interface MeProfile {
  id: string;
  name: string;
  email: string | null;
  nisn: string | null;
  role: Role;
  isActive: boolean;
  photoUrl: string | null;
  createdAt: string;
}

export async function getMyProfile(
  accessToken: string,
): Promise<MeProfile> {
  const json = await authedJson<{ data: MeProfile }>("/auth/me", accessToken);
  return json.data;
}

export async function updateMyProfile(
  accessToken: string,
  body: { fullName?: string; photoUrl?: string | null },
): Promise<MeProfile> {
  const json = await authedJson<{ data: MeProfile }>("/auth/me", accessToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function changeMyPassword(
  accessToken: string,
  body: { currentPassword: string; newPassword: string },
): Promise<void> {
  await authedJson<unknown>("/auth/me/password", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface MePhotoPresign {
  key: string;
  method: "PUT";
  uploadUrl: string;
  fileUrl: string;
}

export async function presignMyPhoto(
  accessToken: string,
  body: { fileName: string; fileSize: number },
): Promise<MePhotoPresign> {
  const json = await authedJson<{ data: MePhotoPresign }>(
    "/auth/me/photo",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
  return json.data;
}

export async function getOrtuProgressReport(
  accessToken: string,
  query?: { studentId?: string; days?: number },
): Promise<OrtuProgressReportApiData> {
  const params = new URLSearchParams();
  if (query?.studentId) params.set("studentId", query.studentId);
  if (query?.days) params.set("days", String(query.days));
  const search = params.toString();
  const path = `/reports/progress/orang-tua${search ? `?${search}` : ""}`;
  const json = await authedJson<{ data: OrtuProgressReportApiData }>(
    path,
    accessToken,
  );
  return json.data;
}
