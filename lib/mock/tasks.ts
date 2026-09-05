export type TaskType = "pilihan_ganda" | "esai" | "upload";

export interface MockTask {
  id: string;
  className: string;
  classId: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  title: string;
  instruction: string;
  type: TaskType;
  daysLeft: number;
  muridStatus: "belum" | "dikumpulkan" | "terlambat";
  muridScore: number | null;
  muridComment: string | null;
  submitted: number;
  totalStudents: number;
  graded: number;
}

interface RawTask {
  id: string;
  classId: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  title: string;
  instruction: string;
  type: TaskType;
  daysLeft: number;
}

const CLASS_LABEL: Record<string, string> = {
  c1: "XII IPA 1",
  c2: "XII IPA 2",
};

const RAW: RawTask[] = [
  {
    id: "tk-1",
    classId: "c1",
    subjectCode: "MTK",
    subjectName: "Matematika",
    teacherName: "Budi Santoso",
    title: "Kuis Turunan Fungsi",
    instruction: "Kerjakan 10 soal pilihan ganda turunan fungsi.",
    type: "pilihan_ganda",
    daysLeft: 1,
  },
  {
    id: "tk-2",
    classId: "c1",
    subjectCode: "MTK",
    subjectName: "Matematika",
    teacherName: "Budi Santoso",
    title: "PR Limit Fungsi",
    instruction: "Tulis penyelesaian limit fungsi aljabar.",
    type: "esai",
    daysLeft: 3,
  },
  {
    id: "tk-3",
    classId: "c1",
    subjectCode: "FIS",
    subjectName: "Fisika",
    teacherName: "Ratna Puspita",
    title: "Latihan Gerak Parabola",
    instruction: "Kerjakan latihan gerak parabola dan kumpulkan jawaban.",
    type: "esai",
    daysLeft: 2,
  },
  {
    id: "tk-4",
    classId: "c1",
    subjectCode: "KIM",
    subjectName: "Kimia",
    teacherName: "Hendra Wijaya",
    title: "Laporan Praktikum Asam-Basa",
    instruction: "Unggah laporan praktikum format PDF.",
    type: "upload",
    daysLeft: 5,
  },
  {
    id: "tk-5",
    classId: "c1",
    subjectCode: "BIN",
    subjectName: "Bahasa Indonesia",
    teacherName: "Sari Wulandari",
    title: "Esai Teks Editorial",
    instruction: "Tulis esai tanggapan terhadap editorial.",
    type: "esai",
    daysLeft: -1,
  },
  {
    id: "tk-6",
    classId: "c1",
    subjectCode: "ING",
    subjectName: "Bahasa Inggris",
    teacherName: "Eko Saputra",
    title: "Reading Comprehension",
    instruction: "Jawab soal pemahaman bacaan.",
    type: "pilihan_ganda",
    daysLeft: 0,
  },
  {
    id: "tk-7",
    classId: "c2",
    subjectCode: "MTK",
    subjectName: "Matematika",
    teacherName: "Budi Santoso",
    title: "Ulangan Integral",
    instruction: "Ulangan integral tentu & tak tentu.",
    type: "pilihan_ganda",
    daysLeft: 2,
  },
  {
    id: "tk-8",
    classId: "c2",
    subjectCode: "FIS",
    subjectName: "Fisika",
    teacherName: "Ratna Puspita",
    title: "Tugas Elastisitas",
    instruction: "Kumpulkan jawaban soal elastisitas bahan.",
    type: "upload",
    daysLeft: 4,
  },
];

const TYPE_LABEL: Record<TaskType, string> = {
  pilihan_ganda: "Pilihan Ganda",
  esai: "Esai",
  upload: "Unggah File",
};

export function taskTypeLabel(type: TaskType): string {
  return TYPE_LABEL[type];
}

function statusCycle(index: number): MockTask["muridStatus"] {
  const value = index % 3;
  if (value === 0) return "belum";
  if (value === 1) return "dikumpulkan";
  return "terlambat";
}

/** Daftar tugas kelas (data tiruan) untuk kelas yang diminta (atau semua). */
export function getMockTasks(classId?: string): MockTask[] {
  const pool = classId ? RAW.filter((t) => t.classId === classId) : RAW;
  return pool.map((task, index) => ({
    id: task.id,
    className: CLASS_LABEL[task.classId] ?? task.classId,
    classId: task.classId,
    subjectCode: task.subjectCode,
    subjectName: task.subjectName,
    teacherName: task.teacherName,
    title: task.title,
    instruction: task.instruction,
    type: task.type,
    daysLeft: task.daysLeft,
    muridStatus: task.daysLeft < 0 ? "terlambat" : statusCycle(index),
    muridScore: statusCycle(index) === "dikumpulkan" && index % 2 === 1 &&
        task.daysLeft >= 0
      ? 78 + (index % 3) * 4
      : null,
    muridComment: statusCycle(index) === "dikumpulkan" && index % 2 === 1 &&
        task.daysLeft >= 0
      ? "Jawabanmu sudah bagus! Perhatikan kembali langkah penyelesaian agar tidak ada langkah yang terlewat."
      : null,
    submitted: task.daysLeft < 0 ? task.classId === "c1" ? 2 : 0 : index % 2,
    totalStudents: task.classId === "c1" ? 3 : 1,
    graded: index % 3 === 0 ? 1 : 0,
  }));
}

/** Ambil satu tugas berdasarkan id (data tiruan). */
export function findTaskById(id: string): MockTask | null {
  return getMockTasks().find((task) => task.id === id) ?? null;
}

export function filterTasks(
  items: MockTask[],
  filters: { subjectCode?: string; type?: TaskType; q?: string },
): MockTask[] {
  return items.filter((task) => {
    if (filters.subjectCode && task.subjectCode !== filters.subjectCode) {
      return false;
    }
    if (filters.type && task.type !== filters.type) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const haystack = [
        task.title,
        task.instruction,
        task.subjectName,
        task.teacherName,
        task.className,
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export interface TaskSubmitter {
  id: string;
  name: string;
  className: string;
  status: "terkumpul" | "terlambat" | "belum";
  answerLabel: string;
  submittedLabel: string | null;
  score: number | null;
}

const CLASS_STUDENTS: Record<string, Array<[string, string]>> = {
  c1: [["m1", "Rani Aulia"], ["m2", "Dimas Pratama"], ["m3", "Ayu Lestari"]],
  c2: [["m4", "Bima Yoga"]],
};

function answerLabelFor(task: MockTask, submitted: boolean): string {
  if (!submitted) return "-";
  if (task.type === "pilihan_ganda") return "3/3 soal dijawab";
  if (task.type === "esai") return "Esai 142 karakter";
  return "jawaban.pdf";
}

function submittedAt(index: number, daysLeft: number): string | null {
  if (daysLeft < 0) return `telat ${Math.abs(daysLeft)} hari`;
  return `H-${daysLeft > 0 ? daysLeft : 0} • ${10 + index}:${15 + index * 3}`;
}

/** Daftar murid & status pengumpulan untuk satu tugas (data tiruan). */
export function getTaskSubmitters(task: MockTask): TaskSubmitter[] {
  const students = CLASS_STUDENTS[task.classId] ?? [];
  return students.map(([id, name], index) => {
    const submitted = index < task.submitted;
    const graded = submitted && index < task.graded;
    const status = submitted
      ? "terkumpul"
      : task.daysLeft < 0
      ? "terlambat"
      : "belum";
    return {
      id,
      name,
      className: task.className,
      status,
      answerLabel: answerLabelFor(task, submitted),
      submittedLabel: submitted ? submittedAt(index, task.daysLeft) : null,
      score: graded ? 85 + index : null,
    };
  });
}

export interface PgAnswerRow {
  question: string;
  muridOption: number;
  correctOption: number;
}

export interface SubmissionDetail {
  muridId: string;
  muridName: string;
  className: string;
  type: MockTask["type"];
  pgAnswers: PgAnswerRow[] | null;
  essayText: string | null;
  uploadName: string | null;
  score: number | null;
  comment: string | null;
}

const MOCK_QUESTIONS_TEXT = [
  "Nilai dari lim x→2 (x² − 4)/(x − 2) adalah …",
  "Turunan dari f(x) = 3x² adalah …",
  "∫ 2x dx sama dengan …",
];

const MOCK_CORRECT = [2, 1, 0];

export function getSubmissionDetail(
  task: MockTask,
  studentId: string,
): SubmissionDetail | null {
  const students = CLASS_STUDENTS[task.classId] ?? [];
  const index = students.findIndex(([id]) => id === studentId);
  if (index === -1) return null;
  const [id, name] = students[index];
  const submitter = getTaskSubmitters(task)[index];

  let pgAnswers: PgAnswerRow[] | null = null;
  let essayText: string | null = null;
  let uploadName: string | null = null;

  if (submitter?.status === "terkumpul") {
    if (task.type === "pilihan_ganda") {
      pgAnswers = MOCK_QUESTIONS_TEXT.map((question, i) => ({
        question,
        muridOption: (i + index) % 4,
        correctOption: MOCK_CORRECT[i],
      }));
    } else if (task.type === "esai") {
      essayText =
        `Penyelesaian ${task.title}:\n\nPertama, tuliskan yang diketahui dan yang ditanyakan. ` +
        `Kemudian terapkan rumus yang sesuai dan sederhanakan langkah demi langkah hingga hasil akhir.`;
    } else {
      uploadName = `jawaban_${task.id}_${id}.pdf`;
    }
  }

  const score = submitter?.score ?? null;
  return {
    muridId: id,
    muridName: name,
    className: task.className,
    type: task.type,
    pgAnswers,
    essayText,
    uploadName,
    score,
    comment: score != null
      ? "Bagus! Perhatikan kembali langkah penyelesaian nomor 2."
      : null,
  };
}
