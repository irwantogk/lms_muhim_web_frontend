import { users } from "./db.ts";

export type MaterialType = "pdf" | "video" | "dokumen";

interface MaterialSeed {
  id: string;
  classId: string;
  subjectId: string;
  title: string;
  description: string;
  type: MaterialType;
  sizeLabel: string;
  uploadedDaysAgo: number;
}

const SUBJECT_LABEL: Record<string, { code: string; name: string }> = {
  "s-mtk": { code: "MTK", name: "Matematika" },
  "s-fis": { code: "FIS", name: "Fisika" },
  "s-kim": { code: "KIM", name: "Kimia" },
  "s-bin": { code: "BIN", name: "Bahasa Indonesia" },
  "s-ing": { code: "ING", name: "Bahasa Inggris" },
};

const CLASS_LABEL: Record<string, string> = {
  c1: "XII IPA 1",
  c2: "XII IPA 2",
  c3: "XI IPS 1",
};

const RAW: MaterialSeed[] = [
  {
    id: "mt-1",
    classId: "c1",
    subjectId: "s-mtk",
    title: "Modul Turunan Fungsi",
    description: "Rangkuman materi turunan fungsi beserta contoh soal.",
    type: "pdf",
    sizeLabel: "1,2 MB",
    uploadedDaysAgo: 1,
  },
  {
    id: "mt-2",
    classId: "c1",
    subjectId: "s-mtk",
    title: "Video Limit Fungsi (Bagian 1)",
    description: "Penjelasan konsep limit fungsi aljabar, durasi 18 menit.",
    type: "video",
    sizeLabel: "84 MB",
    uploadedDaysAgo: 3,
  },
  {
    id: "mt-3",
    classId: "c1",
    subjectId: "s-fis",
    title: "PPT Gerak Parabola",
    description: "Slide presentasi materi gerak parabola untuk kelas.",
    type: "dokumen",
    sizeLabel: "3,4 MB",
    uploadedDaysAgo: 2,
  },
  {
    id: "mt-4",
    classId: "c1",
    subjectId: "s-kim",
    title: "LKS Praktikum Asam-Basa",
    description: "Lembar kerja praktikum asam-basa dan prosedur percobaan.",
    type: "pdf",
    sizeLabel: "620 KB",
    uploadedDaysAgo: 5,
  },
  {
    id: "mt-5",
    classId: "c1",
    subjectId: "s-bin",
    title: "Video Teks Editorial",
    description: "Rekaman pembelajaran teks editorial, durasi 25 menit.",
    type: "video",
    sizeLabel: "96 MB",
    uploadedDaysAgo: 6,
  },
  {
    id: "mt-6",
    classId: "c1",
    subjectId: "s-ing",
    title: "Reading: Analytical Exposition",
    description: "Materi membaca teks eksposisi analitis + latihan.",
    type: "dokumen",
    sizeLabel: "480 KB",
    uploadedDaysAgo: 4,
  },
  {
    id: "mt-7",
    classId: "c2",
    subjectId: "s-mtk",
    title: "Modul Integral Dasar",
    description: "Kumpulan rumus dan latihan integral tak tentu.",
    type: "pdf",
    sizeLabel: "980 KB",
    uploadedDaysAgo: 2,
  },
  {
    id: "mt-8",
    classId: "c2",
    subjectId: "s-fis",
    title: "Video Elastisitas Bahan",
    description: "Praktikum elastisitas bahan (karet & pegas).",
    type: "video",
    sizeLabel: "72 MB",
    uploadedDaysAgo: 8,
  },
];

export interface MaterialItem {
  id: string;
  className: string;
  classId: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  title: string;
  description: string;
  type: MaterialType;
  sizeLabel: string;
  uploadedLabel: string;
}

function teacherFor(subjectId: string): string {
  const map: Record<string, string> = {
    "s-mtk": "g1",
    "s-fis": "g2",
    "s-kim": "g3",
    "s-bin": "g4",
    "s-ing": "g5",
  };
  const id = map[subjectId] ?? "g1";
  return users.find((u) => u.id === id)?.full_name ?? "-";
}

export function materialsForClass(classId?: string): MaterialItem[] {
  const pool = classId ? RAW.filter((m) => m.classId === classId) : RAW;
  return pool.map((m) => {
    const subject = SUBJECT_LABEL[m.subjectId] ??
      { code: "-", name: m.subjectId };
    return {
      id: m.id,
      className: CLASS_LABEL[m.classId] ?? m.classId,
      classId: m.classId,
      subjectCode: subject.code,
      subjectName: subject.name,
      teacherName: teacherFor(m.subjectId),
      title: m.title,
      description: m.description,
      type: m.type,
      sizeLabel: m.sizeLabel,
      uploadedLabel: m.uploadedDaysAgo === 0
        ? "hari ini"
        : `${m.uploadedDaysAgo} hari lalu`,
    };
  });
}

export function filterMaterials(
  items: MaterialItem[],
  filters: { subjectId?: string; type?: string; q?: string },
): MaterialItem[] {
  return items.filter((item) => {
    if (filters.subjectId && item.subjectCode !== filters.subjectId) {
      return false;
    }
    if (filters.type && item.type !== filters.type) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const haystack = [
        item.title,
        item.description,
        item.subjectName,
        item.teacherName,
        item.className,
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
