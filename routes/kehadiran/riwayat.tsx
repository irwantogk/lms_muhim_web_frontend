import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import type { AttendanceStatus, Role } from "@/lib/types.ts";
import { ATTENDANCE_LABEL, Badge } from "@/components/ui/Badge.tsx";
import { Card } from "@/components/ui/Card.tsx";
import {
  type AttendanceSummary,
  getStudentHistory,
  type StudentHistoryEntry,
} from "@/lib/server/backend.ts";

interface RiwayatData {
  role: Role;
  userName: string;
  className: string;
  totalNote: string;
  entries: StudentHistoryEntry[];
  filtered: StudentHistoryEntry[];
  activeStatus: AttendanceStatus | null;
  counts: Record<AttendanceStatus, number>;
  presencePercent: number;
  error: string | null;
}

const STATUS_ORDER: AttendanceStatus[] = [
  "hadir",
  "terlambat",
  "izin",
  "sakit",
];

const TEXT_COLOR: Record<AttendanceStatus, string> = {
  hadir: "text-status-hadir",
  terlambat: "text-status-terlambat",
  izin: "text-status-izin",
  sakit: "text-status-sakit",
};

function isStatus(value: string | null): value is AttendanceStatus {
  return value === "hadir" ||
    value === "terlambat" ||
    value === "izin" ||
    value === "sakit";
}

function timeLabelOf(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function countsFrom(
  summary: AttendanceSummary | undefined,
): Record<AttendanceStatus, number> {
  return {
    hadir: summary?.hadir ?? 0,
    terlambat: summary?.terlambat ?? 0,
    izin: summary?.izin ?? 0,
    sakit: summary?.sakit ?? 0,
  };
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "murid") return ctx.redirect("/kehadiran");

    const url = new URL(ctx.req.url);
    const rawStatus = url.searchParams.get("status");
    const activeStatus = isStatus(rawStatus) ? rawStatus : null;

    let entries: StudentHistoryEntry[] = [];
    let summary: AttendanceSummary | undefined;
    let className = "";
    let error: string | null = null;

    try {
      const data = await getStudentHistory(session.accessToken);
      entries = data.history;
      summary = data.summary;
      className = data.student.className;
    } catch (err) {
      error = err instanceof Error ? err.message : "Gagal memuat riwayat";
    }

    const filtered = activeStatus
      ? entries.filter((entry) => entry.status === activeStatus)
      : entries;

    return page({
      role: session.user.role,
      userName: session.user.name,
      className,
      totalNote: `${entries.length} catatan kehadiran (30 hari terakhir)`,
      entries,
      filtered,
      activeStatus,
      counts: countsFrom(summary),
      presencePercent: summary?.presencePercent ?? 0,
      error,
    });
  },
});

export default define.page<typeof handler>(({ data }) => {
  return (
    <>
      <Head>
        <title>Riwayat Kehadiran — SMA Muhammadiyah Imogiri</title>
      </Head>

      <section class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-sm text-content-muted">Riwayat presensi dari API</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Riwayat Kehadiran
          </h1>
          <p class="mt-1 text-sm text-content-muted">
            {data.userName} • {data.className || "—"} • {data.totalNote}
          </p>
        </div>
        <a
          href="/kehadiran"
          class="inline-flex items-center rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-content-muted transition-colors hover:text-content"
        >
          Kembali ke Kehadiran
        </a>
      </section>

      {data.error && (
        <div
          role="alert"
          class="mb-6 rounded-md border border-status-sakit/30 bg-status-sakit/10 px-3 py-2 text-sm text-status-sakit"
        >
          Gagal memuat riwayat: {data.error}
        </div>
      )}

      <section class="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-sm text-content-muted">Kehadiran</p>
          <p class="mt-1 text-3xl font-bold tabular-nums text-content">
            {data.presencePercent}%
          </p>
        </div>
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            class="rounded-xl border border-border bg-surface p-4"
          >
            <p class="text-sm text-content-muted">{ATTENDANCE_LABEL[status]}</p>
            <p
              class={`mt-1 text-3xl font-bold tabular-nums ${
                TEXT_COLOR[status]
              }`}
            >
              {data.counts[status]}
            </p>
          </div>
        ))}
      </section>

      <div class="mt-6">
        <Card
          title="Daftar Kehadiran"
          description={data.activeStatus
            ? `Menampilkan status ${ATTENDANCE_LABEL[data.activeStatus]}`
            : "Semua status"}
          action={
            <a
              href="/kehadiran/riwayat"
              aria-current={data.activeStatus ? undefined : "page"}
              class={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                data.activeStatus === null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-content-muted hover:text-content"
              }`}
            >
              Semua
            </a>
          }
        >
          <div class="mb-4 flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold uppercase tracking-wide text-content-muted">
              Filter
            </span>
            {STATUS_ORDER.map((status) => {
              const active = data.activeStatus === status;
              return (
                <a
                  key={status}
                  href={`/kehadiran/riwayat?status=${status}`}
                  aria-current={active ? "page" : undefined}
                  class={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-content-muted hover:text-content"
                  }`}
                >
                  {ATTENDANCE_LABEL[status]} ({data.counts[status]})
                </a>
              );
            })}
          </div>

          {data.filtered.length === 0
            ? (
              <p class="py-8 text-center text-sm text-content-muted">
                {data.error
                  ? "Riwayat tidak dapat dimuat."
                  : "Belum ada catatan kehadiran pada periode ini."}
              </p>
            )
            : (
              <ul class="divide-y divide-border">
                {data.filtered.map((entry) => (
                  <li
                    key={entry.id}
                    class="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-content">
                        {entry.subjectName}
                      </p>
                      <p class="text-xs text-content-muted">
                        {entry.dayLabel}, {entry.dateIso} • {entry.teacherName}
                        {" "}
                        • {entry.subjectCode}
                      </p>
                    </div>
                    <div class="shrink-0 text-right">
                      <Badge tone={entry.status}>
                        {ATTENDANCE_LABEL[entry.status]}
                      </Badge>
                      <p class="mt-0.5 text-[10px] text-content-muted">
                        scan {timeLabelOf(entry.scannedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </Card>
      </div>
    </>
  );
});
