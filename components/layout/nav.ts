import type { Role } from "../../lib/types.ts";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  disabled: boolean;
  description: string;
}

function page(label: string, href: string): NavItem {
  return { key: href, label, href, disabled: false, description: "" };
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    page("Beranda", "/"),
    page("Kelola Data Sekolah", "/kelola"),
    page("Laporan & Progres", "/laporan"),
    page("Profil", "/profil"),
  ],
  guru: [
    page("Beranda", "/"),
    page("Kehadiran & Jadwal", "/kehadiran"),
    page("Materi", "/materi"),
    page("Tugas & Penilaian", "/tugas"),
    page("Forum", "/forum"),
    page("Laporan & Progres", "/laporan"),
    page("Profil", "/profil"),
  ],
  murid: [
    page("Beranda", "/"),
    page("Kehadiran & Jadwal", "/kehadiran"),
    page("Materi", "/materi"),
    page("Tugas", "/tugas"),
    page("Forum", "/forum"),
    page("Laporan & Progres", "/laporan"),
  ],
  orang_tua: [
    page("Beranda", "/"),
    page("Laporan & Progres", "/laporan"),
    page("Profil", "/profil"),
  ],
};
