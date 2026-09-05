import type {
  AttendanceRecordItem,
  AttendanceSnapshot,
} from "../../lib/types.ts";
import type { ScanFeedback } from "../../lib/scanFeedback.ts";
import { Card } from "../ui/Card.tsx";
import { ATTENDANCE_LABEL, Badge } from "../ui/Badge.tsx";
import CameraScanner from "../../islands/CameraScanner.tsx";

export interface MuridScanPanelProps {
  summary: AttendanceSnapshot;
  records: AttendanceRecordItem[];
  successCode: string | null;
  feedback: ScanFeedback | null;
}

const FEEDBACK_TONE: Record<ScanFeedback["kind"], string> = {
  invalid: "border border-status-sakit/40 bg-status-sakit/10 text-status-sakit",
  expired: "border border-status-sakit/40 bg-status-sakit/10 text-status-sakit",
  duplicate:
    "border border-status-terlambat/40 bg-status-terlambat/10 text-status-terlambat",
  forbidden:
    "border border-status-sakit/40 bg-status-sakit/10 text-status-sakit",
  failed: "border border-status-sakit/40 bg-status-sakit/10 text-status-sakit",
};

export function MuridScanPanel({
  summary,
  records,
  successCode,
  feedback,
}: MuridScanPanelProps) {
  const present = summary.hadir + summary.terlambat;

  return (
    <div class="grid gap-4">
      {successCode && (
        <div
          role="status"
          class="rounded-md border border-status-hadir/40 bg-status-hadir/10 px-3 py-2 text-sm font-medium text-status-hadir"
        >
          Hadir tercatat untuk kode {successCode} ✓
        </div>
      )}

      {feedback && (
        <div
          role="alert"
          class={`rounded-md px-3 py-2 text-sm font-medium ${
            FEEDBACK_TONE[feedback.kind]
          }`}
        >
          {feedback.message}
        </div>
      )}

      <Card
        title="Kehadiran Hari Ini"
        action={
          <div class="flex items-center gap-2">
            <Badge tone={summary.overall}>
              {ATTENDANCE_LABEL[summary.overall]}
            </Badge>
            <a
              href="/kehadiran/riwayat"
              class="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Riwayat
            </a>
          </div>
        }
      >
        {summary.totalSessions === 0
          ? (
            <p class="py-2 text-center text-sm text-content-muted">
              Tidak ada sesi hari ini (akhir pekan).
            </p>
          )
          : (
            <>
              <p class="text-sm text-content">
                {present} dari {summary.totalSessions} sesi sudah terpresensi.
              </p>
              <p class="mt-1 text-xs text-content-muted">
                {summary.hadir} hadir • {summary.terlambat} terlambat •{" "}
                {summary.izin} izin • {summary.sakit} sakit
              </p>
              <ul class="mt-3 space-y-1.5">
                {records.map((record) => (
                  <li
                    key={record.id}
                    class="flex items-center justify-between rounded-md border border-border bg-surface-subtle px-2.5 py-1.5 text-xs"
                  >
                    <span class="min-w-0 truncate font-medium text-content">
                      {record.subjectName}
                    </span>
                    <Badge tone={record.status}>
                      {ATTENDANCE_LABEL[record.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
      </Card>

      <Card
        title="Pindai Kode (Kamera)"
        description="Arahkan kamera ke kode presensi di layar guru"
      >
        <CameraScanner />
      </Card>

      <Card
        title="Masukkan Kode Presensi"
        description="Alternatif bila kamera tidak tersedia"
      >
        <form method="post" action="/kehadiran" class="space-y-2">
          <input type="hidden" name="action" value="scan" />
          <label
            class="block text-xs font-medium text-content"
            for="absen-code"
          >
            Kode presensi dari guru
          </label>
          <div class="flex gap-2">
            <input
              id="absen-code"
              name="code"
              type="text"
              required
              autocomplete="off"
              placeholder="contoh: AB3XQ7Y9"
              class="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm uppercase tracking-[0.2em] text-content placeholder:normal-case placeholder:tracking-normal placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <button
              type="submit"
              class="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Hadir
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
