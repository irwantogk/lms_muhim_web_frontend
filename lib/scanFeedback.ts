export type ScanFeedbackKind =
  | "invalid"
  | "expired"
  | "duplicate"
  | "forbidden"
  | "failed";

export interface ScanFeedback {
  kind: ScanFeedbackKind;
  message: string;
}

const KINDS = new Set<string>([
  "invalid",
  "expired",
  "duplicate",
  "forbidden",
  "failed",
]);

export const SCAN_FEEDBACK_MESSAGE: Record<ScanFeedbackKind, string> = {
  invalid: "Kode presensi tidak ditemukan. Periksa kembali kode dari guru.",
  expired: "Kode presensi sudah kedaluwarsa. Minta kode baru dari guru.",
  duplicate: "Kode sudah digunakan — Anda sudah tercatat hadir pada sesi ini.",
  forbidden: "Anda tidak terdaftar di kelas sesi ini.",
  failed: "Gagal mencatat kehadiran. Silakan coba lagi.",
};

export function scanKindFromErrorCode(code?: string): ScanFeedbackKind {
  switch (code) {
    case "NOT_FOUND":
      return "invalid";
    case "VALIDATION_ERROR":
      return "expired";
    case "FORBIDDEN":
      return "forbidden";
    case "CONFLICT":
      return "duplicate";
    default:
      return "failed";
  }
}

export function scanFeedbackFromParam(
  value: string | null,
): ScanFeedback | null {
  if (!value || !KINDS.has(value)) return null;
  const kind = value as ScanFeedbackKind;
  return { kind, message: SCAN_FEEDBACK_MESSAGE[kind] };
}
