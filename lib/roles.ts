import type { Role, RoleTone } from "./types.ts";

export interface RoleMeta {
  role: Role;
  label: string;
  labelPlural: string;
  /** Tailwind literal — gradient untuk header/shell peran */
  gradient: string;
  /** Tailwind literal — warna solid aksen peran */
  solid: string;
  /** Tailwind literal — teks warna aksen peran */
  text: string;
  /** Tailwind literal — latar lembut warna aksen peran */
  soft: string;
  /** Tailwind literal — border warna aksen peran */
  border: string;
}

export const ROLE_META: Record<Role, RoleMeta> = {
  admin: {
    role: "admin",
    label: "Admin",
    labelPlural: "Admin",
    gradient: "from-role-admin to-role-guru",
    solid: "bg-role-admin",
    text: "text-role-admin",
    soft: "bg-role-admin/10",
    border: "border-role-admin/30",
  },
  guru: {
    role: "guru",
    label: "Guru",
    labelPlural: "Guru",
    gradient: "from-role-guru to-role-murid",
    solid: "bg-role-guru",
    text: "text-role-guru",
    soft: "bg-role-guru/10",
    border: "border-role-guru/30",
  },
  murid: {
    role: "murid",
    label: "Murid",
    labelPlural: "Murid",
    gradient: "from-role-murid to-role-ortu",
    solid: "bg-role-murid",
    text: "text-role-murid",
    soft: "bg-role-murid/10",
    border: "border-role-murid/30",
  },
  orang_tua: {
    role: "orang_tua",
    label: "Orang Tua",
    labelPlural: "Orang Tua",
    gradient: "from-role-ortu to-role-admin",
    solid: "bg-role-ortu",
    text: "text-role-ortu",
    soft: "bg-role-ortu/10",
    border: "border-role-ortu/30",
  },
};

export const TONE_META: Record<RoleTone, {
  solid: string;
  soft: string;
  text: string;
  bar: string;
}> = {
  primary: {
    solid: "bg-primary",
    soft: "bg-primary/10",
    text: "text-primary",
    bar: "bg-primary",
  },
  admin: {
    solid: "bg-role-admin",
    soft: "bg-role-admin/10",
    text: "text-role-admin",
    bar: "bg-role-admin",
  },
  guru: {
    solid: "bg-role-guru",
    soft: "bg-role-guru/10",
    text: "text-role-guru",
    bar: "bg-role-guru",
  },
  murid: {
    solid: "bg-role-murid",
    soft: "bg-role-murid/10",
    text: "text-role-murid",
    bar: "bg-role-murid",
  },
  ortu: {
    solid: "bg-role-ortu",
    soft: "bg-role-ortu/10",
    text: "text-role-ortu",
    bar: "bg-role-ortu",
  },
};
