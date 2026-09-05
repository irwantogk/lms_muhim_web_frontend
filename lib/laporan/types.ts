/** Rekap nilai per kelas & mata pelajaran (guru / admin). */
export interface RekapNilaiRow {
  id: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  /** Jumlah tugas yang diterbitkan. */
  taskCount: number;
  /** Jumlah tugas yang sudah dinilai. */
  gradedCount: number;
  /** Rata-rata nilai kelas, null bila belum ada tugas dinilai. */
  average: number | null;
  /** Nilai tertinggi. */
  highest: number | null;
  /** Nilai terendah. */
  lowest: number | null;
}

/** Rekap kehadiran per kelas & mata pelajaran (guru / admin). */
export interface RekapAbsenRow {
  id: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  /** Jumlah catatan kehadiran (hadir + terlambat + izin + sakit). */
  opportunities: number;
  /** Persentase kehadiran (hadir + terlambat) terhadap catatan. */
  presencePercent: number;
}

/** Ringkasan progres sebuah mata pelajaran (murid / orang tua). */
export interface ProgressMapel {
  subjectCode: string;
  subjectName: string;
  /** Rata-rata nilai, null bila belum ada tugas dinilai. */
  avgScore: number | null;
  /** Total tugas yang tersedia. */
  totalTasks: number;
  /** Tugas yang sudah dikerjakan / dikumpulkan. */
  doneTasks: number;
}

/** Entri nilai (hasil tugas) milik murid. */
export interface ScoreEntry {
  id: string;
  title: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  taskTypeLabel: string;
  /** Nilai, null berarti belum dikoreksi guru. */
  score: number | null;
  feedback: string | null;
  /** Label tanggal kumpul yang sudah diformat. */
  submittedLabel: string;
  /** ISO tanggal kumpul untuk keperluan urutan. */
  submittedIso: string;
}

/** Entri riwayat kehadiran (murid). */
export interface AttendanceEntry {
  id: string;
  /** Label tanggal yang sudah diformat. */
  dateLabel: string;
  /** Hari (Sen/Kam/dst). */
  dayLabel: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  status: "hadir" | "terlambat" | "izin" | "sakit";
  /** ISO untuk pengurutan. */
  dateIso: string;
}

/** Ringkasan angka agregat progres murid. */
export interface MuridSummary {
  avgScore: number | null;
  totalTasks: number;
  doneTasks: number;
  gradedTasks: number;
  presence: {
    hadir: number;
    terlambat: number;
    izin: number;
    sakit: number;
    opportunities: number;
    presencePercent: number;
  };
}

/** Ringkasan kehadiran seorang anak (orang tua). */
export interface ChildAttendance {
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  opportunities: number;
  presencePercent: number;
}

/** Data anak untuk halaman pantauan orang tua. */
export interface ChildProgress {
  id: string;
  name: string;
  className: string;
  avgScore: number | null;
  taskDone: number;
  taskTotal: number;
  attendance: ChildAttendance;
  /** Kehadiran hari ini (opsional, dari API pantauan orang tua). */
  today?: ChildAttendance;
  /** Rincian per mapel; kosong bila belum tersedia dari API. */
  mapel: ProgressMapel[];
  /** Riwayat nilai anak (opsional, dari API progres). */
  grades?: ScoreEntry[];
  /** Riwayat kehadiran anak (opsional, dari API progres). */
  history?: AttendanceEntry[];
}

/** Tombol pilihan kelas pada baris filter. */
export interface ClassTabOption {
  id: string;
  name: string;
  isCurrent: boolean;
}

/** Tombol pilihan mapel pada baris filter. */
export interface SubjectOption {
  code: string;
  name: string;
  isCurrent: boolean;
}
