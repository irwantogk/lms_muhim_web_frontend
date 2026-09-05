import type { AssignmentType, User } from "../types.ts";

export interface KlassSeed {
  id: string;
  name: string;
  grade: number;
}

export interface SubjectSeed {
  id: string;
  code: string;
  name: string;
}

export interface ClassSubjectTeacherSeed {
  classId: string;
  subjectId: string;
  teacherId: string;
}

export interface ClassStudentSeed {
  classId: string;
  studentId: string;
}

export interface ParentStudentSeed {
  parentId: string;
  studentId: string;
  relation: string;
}

export interface ScheduleSeed {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number; // 0=Min ... 6=Sab
  start: string;
  end: string;
}

export interface AssignmentSeed {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  type: AssignmentType;
  daysAhead: number;
}

export interface SubmissionSeed {
  assignmentId: string;
  studentId: string;
  studentName: string;
  graded: boolean;
}

const academicYear = "2025/2026";

export const users: User[] = [
  // Admin
  {
    id: "a1",
    full_name: "Dewi Anggraini",
    role: "admin",
    email: "admin@cendekia.sch.id",
  },
  // Guru
  {
    id: "g1",
    full_name: "Budi Santoso",
    role: "guru",
    email: "budi.santoso@cendekia.sch.id",
  },
  {
    id: "g2",
    full_name: "Ratna Puspita",
    role: "guru",
    email: "ratna.puspita@cendekia.sch.id",
  },
  {
    id: "g3",
    full_name: "Hendra Wijaya",
    role: "guru",
    email: "hendra.wijaya@cendekia.sch.id",
  },
  {
    id: "g4",
    full_name: "Sari Wulandari",
    role: "guru",
    email: "sari.wulandari@cendekia.sch.id",
  },
  {
    id: "g5",
    full_name: "Eko Saputra",
    role: "guru",
    email: "eko.saputra@cendekia.sch.id",
  },
  // Murid
  {
    id: "m1",
    full_name: "Rani Aulia",
    role: "murid",
    email: "rani.aulia@cendekia.sch.id",
  },
  {
    id: "m2",
    full_name: "Dimas Pratama",
    role: "murid",
    email: "dimas.pratama@cendekia.sch.id",
  },
  {
    id: "m3",
    full_name: "Ayu Lestari",
    role: "murid",
    email: "ayu.lestari@cendekia.sch.id",
  },
  {
    id: "m4",
    full_name: "Bima Yoga",
    role: "murid",
    email: "bima.yoga@cendekia.sch.id",
  },
  {
    id: "m5",
    full_name: "Citra Kirana",
    role: "murid",
    email: "citra.kirana@cendekia.sch.id",
  },
  // Orang tua
  {
    id: "p1",
    full_name: "Siti Rahayu",
    role: "orang_tua",
    email: "siti.rahayu@mail.com",
  },
  {
    id: "p2",
    full_name: "Agus Setiawan",
    role: "orang_tua",
    email: "agus.setiawan@mail.com",
  },
  {
    id: "p3",
    full_name: "Maya Indah",
    role: "orang_tua",
    email: "maya.indah@mail.com",
  },
];

export const classes: KlassSeed[] = [
  { id: "c1", name: "XII IPA 1", grade: 12 },
  { id: "c2", name: "XII IPA 2", grade: 12 },
  { id: "c3", name: "XI IPS 1", grade: 11 },
];

export const subjects: SubjectSeed[] = [
  { id: "s-mtk", code: "MTK", name: "Matematika" },
  { id: "s-fis", code: "FIS", name: "Fisika" },
  { id: "s-kim", code: "KIM", name: "Kimia" },
  { id: "s-bin", code: "BIN", name: "Bahasa Indonesia" },
  { id: "s-ing", code: "ING", name: "Bahasa Inggris" },
];

export const classSubjectTeacher: ClassSubjectTeacherSeed[] = [
  { classId: "c1", subjectId: "s-mtk", teacherId: "g1" },
  { classId: "c1", subjectId: "s-fis", teacherId: "g2" },
  { classId: "c1", subjectId: "s-kim", teacherId: "g3" },
  { classId: "c1", subjectId: "s-bin", teacherId: "g4" },
  { classId: "c1", subjectId: "s-ing", teacherId: "g5" },
  { classId: "c2", subjectId: "s-mtk", teacherId: "g1" },
  { classId: "c2", subjectId: "s-fis", teacherId: "g2" },
  { classId: "c2", subjectId: "s-bin", teacherId: "g4" },
  { classId: "c3", subjectId: "s-bin", teacherId: "g4" },
  { classId: "c3", subjectId: "s-ing", teacherId: "g5" },
];

export const classStudents: ClassStudentSeed[] = [
  { classId: "c1", studentId: "m1" },
  { classId: "c1", studentId: "m2" },
  { classId: "c1", studentId: "m3" },
  { classId: "c2", studentId: "m4" },
  { classId: "c3", studentId: "m5" },
];

export const parentStudents: ParentStudentSeed[] = [
  { parentId: "p1", studentId: "m1", relation: "Ibu" },
  { parentId: "p2", studentId: "m2", relation: "Ayah" },
  { parentId: "p3", studentId: "m3", relation: "Ibu" },
];

// Jadwal: 1=Senin ... 5=Jumat. Akhir pekan kosong.
const s =
  (id: string, classId: string, subjectId: string, teacherId: string) =>
  (dayOfWeek: number, start: string, end: string): ScheduleSeed => ({
    id,
    classId,
    subjectId,
    teacherId,
    dayOfWeek,
    start,
    end,
  });

export const schedules: ScheduleSeed[] = [
  // Kelas XII IPA 1
  s("sc1", "c1", "s-mtk", "g1")(1, "07:00", "08:40"),
  s("sc2", "c1", "s-fis", "g2")(1, "08:40", "10:20"),
  s("sc3", "c1", "s-kim", "g3")(1, "12:30", "14:10"),
  s("sc4", "c1", "s-bin", "g4")(2, "07:00", "08:40"),
  s("sc5", "c1", "s-ing", "g5")(2, "08:40", "10:20"),
  s("sc6", "c1", "s-mtk", "g1")(2, "10:20", "12:00"),
  s("sc7", "c1", "s-fis", "g2")(3, "07:00", "08:40"),
  s("sc8", "c1", "s-kim", "g3")(3, "08:40", "10:20"),
  s("sc9", "c1", "s-bin", "g4")(3, "10:20", "12:00"),
  s("sc10", "c1", "s-ing", "g5")(4, "07:00", "08:40"),
  s("sc11", "c1", "s-mtk", "g1")(4, "08:40", "10:20"),
  s("sc12", "c1", "s-fis", "g2")(4, "10:20", "12:00"),
  s("sc13", "c1", "s-kim", "g3")(5, "07:00", "08:40"),
  s("sc14", "c1", "s-bin", "g4")(5, "08:40", "10:20"),
  s("sc15", "c1", "s-ing", "g5")(5, "10:20", "12:00"),
  // Kelas XII IPA 2 (guru pengampu berbeda)
  s("sc16", "c2", "s-mtk", "g1")(1, "10:20", "12:00"),
  s("sc17", "c2", "s-fis", "g2")(2, "10:20", "12:00"),
  s("sc18", "c2", "s-mtk", "g1")(3, "12:00", "13:40"),
  s("sc19", "c2", "s-bin", "g4")(4, "10:20", "12:00"),
  s("sc20", "c2", "s-fis", "g2")(5, "10:20", "12:00"),
  // Kelas XI IPS 1
  s("sc21", "c3", "s-bin", "g4")(1, "07:00", "08:40"),
  s("sc22", "c3", "s-ing", "g5")(3, "07:00", "08:40"),
  s("sc23", "c3", "s-ing", "g5")(5, "07:00", "08:40"),
];

export const assignments: AssignmentSeed[] = [
  {
    id: "a1",
    classId: "c1",
    subjectId: "s-mtk",
    teacherId: "g1",
    title: "Kuis Turunan Fungsi",
    type: "pilihan_ganda",
    daysAhead: 1,
  },
  {
    id: "a2",
    classId: "c1",
    subjectId: "s-mtk",
    teacherId: "g1",
    title: "PR Limit Fungsi",
    type: "esai",
    daysAhead: 3,
  },
  {
    id: "a3",
    classId: "c1",
    subjectId: "s-fis",
    teacherId: "g2",
    title: "Latihan Gerak Parabola",
    type: "esai",
    daysAhead: 2,
  },
  {
    id: "a4",
    classId: "c1",
    subjectId: "s-kim",
    teacherId: "g3",
    title: "Laporan Praktikum Asam-Basa",
    type: "upload",
    daysAhead: 5,
  },
  {
    id: "a5",
    classId: "c2",
    subjectId: "s-mtk",
    teacherId: "g1",
    title: "Ulangan Integral",
    type: "pilihan_ganda",
    daysAhead: 2,
  },
];

export const submissions: SubmissionSeed[] = [
  {
    assignmentId: "a1",
    studentId: "m2",
    studentName: "Dimas Pratama",
    graded: false,
  },
  {
    assignmentId: "a1",
    studentId: "m3",
    studentName: "Ayu Lestari",
    graded: false,
  },
  {
    assignmentId: "a5",
    studentId: "m4",
    studentName: "Bima Yoga",
    graded: false,
  },
  {
    assignmentId: "a2",
    studentId: "m2",
    studentName: "Dimas Pratama",
    graded: true,
  },
];

export const classStudentCounts: Record<string, number> = {
  c1: 3,
  c2: 1,
  c3: 1,
};

export { academicYear };
