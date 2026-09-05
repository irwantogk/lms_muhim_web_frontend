import type {
  AttendanceEntry,
  MuridSummary,
  ProgressMapel,
  ScoreEntry,
} from "@/lib/laporan/types.ts";
import { formatDecimal, formatPercent } from "@/lib/laporan/format.ts";
import { Card } from "@/components/ui/Card.tsx";
import { ATTENDANCE_LABEL, Badge } from "@/components/ui/Badge.tsx";
import { ProgressBar } from "@/components/ui/ProgressBar.tsx";
import { CsvButton } from "@/components/laporan/CsvButton.tsx";
import { MapelProgressList } from "@/components/laporan/MapelProgressList.tsx";
import { ProgressCharts } from "@/components/laporan/ProgressCharts.tsx";
import type { CsvCell } from "@/lib/laporan/csv.ts";

export interface PeriodeOption {
  value: string;
  label: string;
  isCurrent: boolean;
}

export interface MuridReportData {
  className: string;
  /** Pesan (mis. error pemuatan) bila ada. */
  note?: string | null;
  summary: MuridSummary;
  mapel: ProgressMapel[];
  grades: ScoreEntry[];
  history: AttendanceEntry[];
  periodeOptions: PeriodeOption[];
}

const GRADE_CSV_HEADERS = [
  "Tugas",
  "Mata Pelajaran",
  "Jenis",
  "Tanggal Kumpul",
  "Nilai",
];

function gradeCsvRows(rows: ScoreEntry[]): CsvCell[][] {
  return rows.map((row) => [
    row.title,
    row.subjectName,
    row.taskTypeLabel,
    row.submittedLabel,
    row.score,
  ]);
}

const ABSEN_CSV_HEADERS = ["Tanggal", "Mata Pelajaran", "Guru", "Status"];

function historyCsvRows(rows: AttendanceEntry[]): CsvCell[][] {
  return rows.map((row) => [
    row.dateLabel,
    row.subjectName,
    row.teacherName,
    ATTENDANCE_LABEL[row.status],
  ]);
}

function periodeHref(value: string): string {
  return value === "30" ? "/laporan" : `/laporan?periode=${value}`;
}

/** Halaman Progres Belajar untuk Murid. */
export function MuridReport({ data }: { data: MuridReportData }) {
  const { summary, mapel, grades, history } = data;
  const presence = summary.presence;

  const stats = [
    {
      label: "Rata-rata Nilai",
      value: summary.avgScore == null ? "—" : formatDecimal(summary.avgScore),
      toneText: "text-role-ortu",
    },
    {
      label: "Tugas Dikerjakan",
      value: `${summary.doneTasks}/${summary.totalTasks}`,
      toneText: "text-role-murid",
      hint: `${summary.gradedTasks} sudah dinilai`,
    },
    {
      label: "% Kehadiran",
      value: formatPercent(presence.presencePercent),
      toneText: "text-status-hadir",
      hint: `${presence.hadir} hadir • ${presence.terlambat} terlambat`,
    },
    {
      label: "Catatan Kehadiran",
      value: String(presence.opportunities),
      toneText: "text-content",
      hint: `${presence.izin} izin • ${presence.sakit} sakit`,
    },
  ];

  return (
    <div class="grid gap-6">
      {data.note && (
        <div
          role="alert"
          class="rounded-md border border-status-sakit/30 bg-status-sakit/10 px-3 py-2 text-sm text-status-sakit"
        >
          {data.note}
        </div>
      )}

      <section class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            class="rounded-xl border border-border bg-surface p-4"
          >
            <p class="text-sm text-content-muted">{stat.label}</p>
            <p
              class={`mt-1 truncate text-2xl font-bold tabular-nums ${stat.toneText}`}
            >
              {stat.value}
            </p>
            {stat.hint && (
              <p class="mt-1 text-xs text-content-muted">{stat.hint}</p>
            )}
          </div>
        ))}
      </section>

      <Card
        title="Grafik Progres Belajar"
        description="Nilai rata-rata dan penyelesaian tugas per mata pelajaran"
      >
        <ProgressCharts rows={mapel} />
      </Card>

      <div class="grid gap-6 lg:grid-cols-2">
        <Card
          title="Progres per Mata Pelajaran"
          description="Rata-rata nilai dan penyelesaian tugas"
        >
          <MapelProgressList rows={mapel} />
        </Card>

        <Card
          title="Ringkasan Kehadiran"
          description={`Rekap kehadiran dalam periode terpilih`}
        >
          <div class="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span class="font-semibold uppercase tracking-wide text-content-muted">
              Periode
            </span>
            {data.periodeOptions.map((option) => (
              <a
                key={option.value}
                href={periodeHref(option.value)}
                aria-current={option.isCurrent ? "page" : undefined}
                class={`rounded-full border px-2.5 py-1 font-medium ${
                  option.isCurrent
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-content-muted hover:text-content"
                }`}
              >
                {option.label}
              </a>
            ))}
          </div>

          <div class="grid grid-cols-2 gap-3">
            {(["hadir", "terlambat", "izin", "sakit"] as const).map(
              (status) => (
                <div
                  key={status}
                  class="flex items-center justify-between rounded-lg border border-border bg-surface-subtle px-3 py-2"
                >
                  <span class="text-xs font-medium text-content-muted">
                    {ATTENDANCE_LABEL[status]}
                  </span>
                  <span class="text-lg font-bold tabular-nums text-content">
                    {presence[status]}
                  </span>
                </div>
              ),
            )}
          </div>

          <div class="mt-4">
            <div class="mb-1 flex items-center justify-between text-xs">
              <span class="text-content-muted">Tingkat kehadiran</span>
              <span class="font-semibold tabular-nums text-content">
                {formatPercent(presence.presencePercent)}
              </span>
            </div>
            <ProgressBar
              value={presence.presencePercent}
              max={100}
              tone="murid"
            />
          </div>
        </Card>
      </div>

      <Card
        title="Riwayat Nilai Terbaru"
        description={`${data.className} — tugas yang sudah dinilai`}
        action={
          <CsvButton
            filename="progres-nilai.csv"
            headers={GRADE_CSV_HEADERS}
            rows={gradeCsvRows(grades)}
            disabled={grades.length === 0}
          />
        }
      >
        {grades.length === 0
          ? (
            <p class="py-8 text-center text-sm text-content-muted">
              Belum ada tugas yang dikumpulkan.
            </p>
          )
          : (
            <div class="overflow-x-auto">
              <table class="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr class="text-left text-xs uppercase tracking-wide text-content-muted">
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Tugas
                    </th>
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Mapel
                    </th>
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Jenis
                    </th>
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Dikumpulkan
                    </th>
                    <th class="border-b border-border px-3 py-2 text-right font-semibold">
                      Nilai
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grades.slice(0, 12).map((row) => (
                    <tr key={row.id} class="border-b border-border align-top">
                      <td class="px-3 py-2 font-medium text-content">
                        {row.title}
                        {row.feedback && (
                          <p class="mt-0.5 max-w-64 text-xs italic text-content-muted">
                            “{row.feedback}”
                          </p>
                        )}
                      </td>
                      <td class="whitespace-nowrap px-3 py-2 text-xs text-content-muted">
                        {row.subjectName} • {row.subjectCode}
                      </td>
                      <td class="px-3 py-2 text-xs text-content-muted">
                        {row.taskTypeLabel}
                      </td>
                      <td class="whitespace-nowrap px-3 py-2 text-xs text-content-muted">
                        {row.submittedLabel}
                      </td>
                      <td class="px-3 py-2 text-right">
                        {row.score == null
                          ? <Badge tone="neutral">Menunggu</Badge>
                          : (
                            <span class="inline-flex items-center rounded-full bg-role-ortu/10 px-2.5 py-0.5 text-sm font-bold text-role-ortu">
                              {row.score}
                            </span>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      <Card
        title="Rekap Kehadiran"
        description={`Riwayat presensi dalam periode terpilih (${history.length} catatan)`}
        action={
          <CsvButton
            filename="progres-kehadiran.csv"
            headers={ABSEN_CSV_HEADERS}
            rows={historyCsvRows(history)}
            disabled={history.length === 0}
          />
        }
      >
        {history.length === 0
          ? (
            <p class="py-8 text-center text-sm text-content-muted">
              Belum ada catatan kehadiran pada periode ini.
            </p>
          )
          : (
            <div class="overflow-x-auto">
              <table class="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr class="text-left text-xs uppercase tracking-wide text-content-muted">
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Tanggal
                    </th>
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Mapel
                    </th>
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Guru
                    </th>
                    <th class="border-b border-border px-3 py-2 text-right font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 20).map((row) => (
                    <tr key={row.id} class="border-b border-border align-top">
                      <td class="whitespace-nowrap px-3 py-2 text-xs text-content">
                        {row.dateLabel}
                      </td>
                      <td class="whitespace-nowrap px-3 py-2 text-xs text-content-muted">
                        {row.subjectName}
                      </td>
                      <td class="whitespace-nowrap px-3 py-2 text-xs text-content-muted">
                        {row.teacherName}
                      </td>
                      <td class="px-3 py-2 text-right">
                        <Badge tone={row.status}>
                          {ATTENDANCE_LABEL[row.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </div>
  );
}
