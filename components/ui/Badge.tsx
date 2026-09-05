import type { ComponentChildren } from "preact";
import type { AttendanceStatus } from "../../lib/types.ts";

export type BadgeTone =
  | AttendanceStatus
  | "belum"
  | "neutral"
  | "primary"
  | "admin"
  | "guru"
  | "murid"
  | "ortu";

const TONES: Record<BadgeTone, string> = {
  hadir: "bg-status-hadir/10 text-status-hadir border-status-hadir/30",
  terlambat:
    "bg-status-terlambat/10 text-status-terlambat border-status-terlambat/30",
  izin: "bg-status-izin/10 text-status-izin border-status-izin/30",
  sakit: "bg-status-sakit/10 text-status-sakit border-status-sakit/30",
  belum: "bg-surface-muted text-content-muted border-border-strong",
  neutral: "bg-surface-muted text-content-muted border-border-strong",
  primary: "bg-primary/10 text-primary border-primary/30",
  admin: "bg-role-admin/10 text-role-admin border-role-admin/30",
  guru: "bg-role-guru/10 text-role-guru border-role-guru/30",
  murid: "bg-role-murid/10 text-role-murid border-role-murid/30",
  ortu: "bg-role-ortu/10 text-role-ortu border-role-ortu/30",
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus | "belum", string> = {
  hadir: "Hadir",
  terlambat: "Terlambat",
  izin: "Izin",
  sakit: "Sakit",
  belum: "Belum",
};

export interface BadgeProps {
  tone?: BadgeTone;
  children?: ComponentChildren;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <span
      class={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        TONES[tone]
      }`}
    >
      {children}
    </span>
  );
}
