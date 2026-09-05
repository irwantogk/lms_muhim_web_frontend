import type { QuickLink, Role } from "./types.ts";

const DEFS: Record<
  Role,
  Array<{
    label: string;
    description: string;
    tone: QuickLink["tone"];
    monogram: string;
    href: string;
  }>
> = {
  admin: [
    {
      label: "Kelola Pengguna",
      description: "Tambah / nonaktifkan akun",
      monogram: "PG",
      tone: "admin",
      href: "/kelola?tab=pengguna",
    },
    {
      label: "Kelas & Mapel",
      description: "Atur kelas dan mata pelajaran",
      monogram: "KM",
      tone: "guru",
      href: "/kelola",
    },
    {
      label: "Keanggotaan",
      description: "Murid per kelas & guru pengampu",
      monogram: "KA",
      tone: "murid",
      href: "/kelola?tab=keanggotaan",
    },
    {
      label: "Laporan & CSV",
      description: "Rekap nilai & kehadiran",
      monogram: "LP",
      tone: "ortu",
      href: "/laporan",
    },
  ],
  guru: [
    {
      label: "Buat Sesi Absensi",
      description: "Tampilkan kode ke murid",
      monogram: "AB",
      tone: "guru",
      href: "/kehadiran",
    },
    {
      label: "Materi",
      description: "Unggah PDF / video",
      monogram: "MT",
      tone: "murid",
      href: "/materi",
    },
    {
      label: "Tugas & Penilaian",
      description: "Buat tugas & koreksi",
      monogram: "TG",
      tone: "primary",
      href: "/tugas",
    },
    {
      label: "Forum Kelas",
      description: "Moderasi diskusi",
      monogram: "FM",
      tone: "ortu",
      href: "/forum",
    },
    {
      label: "Laporan & Progres",
      description: "Rekap nilai & kehadiran",
      monogram: "LP",
      tone: "murid",
      href: "/laporan",
    },
  ],
  murid: [
    {
      label: "Scan Presensi",
      description: "Hadir via kode kelas",
      monogram: "SC",
      tone: "murid",
      href: "/kehadiran",
    },
    {
      label: "Materi",
      description: "Baca / unduh pelajaran",
      monogram: "MT",
      tone: "guru",
      href: "/materi",
    },
    {
      label: "Tugas Saya",
      description: "Kerjakan & kumpulkan",
      monogram: "TG",
      tone: "primary",
      href: "/tugas",
    },
    {
      label: "Forum Kelas",
      description: "Tanya & diskusi",
      monogram: "FM",
      tone: "ortu",
      href: "/forum",
    },
    {
      label: "Progres Belajar",
      description: "Grafik nilai & kehadiran",
      monogram: "PR",
      tone: "murid",
      href: "/laporan",
    },
  ],
  orang_tua: [
    {
      label: "Kehadiran Anak",
      description: "Cek hadir hari ini",
      monogram: "KH",
      tone: "ortu",
      href: "/laporan",
    },
    {
      label: "Progres Anak",
      description: "Grafik nilai & tugas",
      monogram: "PR",
      tone: "murid",
      href: "/laporan",
    },
    {
      label: "Laporan",
      description: "Rekap bulanan",
      monogram: "LP",
      tone: "primary",
      href: "/laporan",
    },
    {
      label: "Profil",
      description: "Data & kata sandi",
      monogram: "PF",
      tone: "admin",
      href: "/profil",
    },
  ],
};

export function quickLinksFor(role: Role): QuickLink[] {
  return DEFS[role].map((item) => ({ ...item, id: item.label }));
}
