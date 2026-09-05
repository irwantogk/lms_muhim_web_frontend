import type { ChildProgress } from "@/lib/laporan/types.ts";
import { formatDecimal, formatPercent } from "@/lib/laporan/format.ts";
import { Card } from "@/components/ui/Card.tsx";
import { Avatar } from "@/components/ui/Avatar.tsx";
import { ProgressBar } from "@/components/ui/ProgressBar.tsx";
import { ATTENDANCE_LABEL, Badge } from "@/components/ui/Badge.tsx";
import { MapelProgressList } from "@/components/laporan/MapelProgressList.tsx";
import { ProgressCharts } from "@/components/laporan/ProgressCharts.tsx";

export interface OrtuReportData {
  children: ChildProgress[];
  currentChildId: string | null;
  currentChild: ChildProgress | null;
  /** Pesan (mis. error pemuatan) bila ada. */
  note?: string | null;
}

function childHref(id: string): string {
  return `/laporan?child=${encodeURIComponent(id)}`;
}

/** Halaman Pantauan Anak untuk Orang Tua. */
export function OrtuReport({ data }: { data: OrtuReportData }) {
  const child = data.currentChild;

  if (data.children.length === 0) {
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
        <Card title="Pantauan Anak">
          <p class="py-8 text-center text-sm text-content-muted">
            Belum ada anak terhubung ke akun Anda.
          </p>
        </Card>
      </div>
    );
  }

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

      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="font-semibold uppercase tracking-wide text-content-muted">
          Anak
        </span>
        {data.children.map((item) => {
          const active = item.id === data.currentChildId;
          return (
            <a
              key={item.id}
              href={childHref(item.id)}
              aria-current={active ? "page" : undefined}
              class={`rounded-full border px-3 py-1 font-medium ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-content-muted hover:text-content"
              }`}
            >
              {item.name}
            </a>
          );
        })}
      </div>

      {child && (
        <>
          <section class="rounded-xl border border-border bg-surface p-4 shadow-xs sm:p-5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex min-w-0 items-center gap-3">
                <Avatar name={child.name} size="lg" tone="ortu" />
                <div class="min-w-0">
                  <p class="font-semibold text-content">{child.name}</p>
                  <p class="text-sm text-content-muted">{child.className}</p>
                  <p class="mt-1 text-xs font-semibold text-status-hadir">
                    {formatPercent(child.attendance.presencePercent)} kehadiran
                  </p>
                  {child.today && (
                    <p class="text-xs text-content-muted">
                      Hari ini: {child.today.hadir} hadir •{" "}
                      {child.today.terlambat} terlambat • {child.today.izin}
                      {" "}
                      izin • {child.today.sakit} sakit
                    </p>
                  )}
                </div>
              </div>

              <div class="grid w-full gap-4 sm:w-2/3 sm:grid-cols-3">
                <div>
                  <p class="text-xs text-content-muted">Nilai rata-rata</p>
                  <p class="mt-0.5 text-2xl font-bold tabular-nums text-role-ortu">
                    {child.avgScore == null
                      ? "—"
                      : formatDecimal(child.avgScore)}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-content-muted">Tugas selesai</p>
                  <p class="mt-0.5 text-2xl font-bold tabular-nums text-content">
                    {child.taskDone}/{child.taskTotal}
                  </p>
                  <ProgressBar
                    value={child.taskDone}
                    max={child.taskTotal}
                    tone="murid"
                    class="mt-1"
                  />
                </div>
                <div>
                  <p class="text-xs text-content-muted">
                    Kehadiran (30 hari terakhir)
                  </p>
                  <p class="mt-0.5 text-sm font-medium text-content">
                    {child.attendance.hadir} hadir •{" "}
                    {child.attendance.terlambat} terlambat
                  </p>
                  <p class="text-xs text-content-muted">
                    {child.attendance.izin} izin • {child.attendance.sakit}{" "}
                    sakit
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Card
            title="Grafik Progres Belajar"
            description={`Nilai rata-rata dan penyelesaian tugas ${child.name}`}
          >
            <ProgressCharts
              rows={child.mapel}
              emptyMessage="Belum ada data per mapel untuk anak ini."
            />
          </Card>

          <Card
            title="Progres per Mata Pelajaran"
            description={`Rata-rata nilai dan penyelesaian tugas ${child.name}`}
          >
            <MapelProgressList
              rows={child.mapel}
              emptyMessage="Belum ada data per mapel untuk anak ini."
            />
          </Card>

          {(child.grades?.length ?? 0) > 0 && (
            <Card
              title="Riwayat Nilai"
              description={`Nilai tugas ${child.name} yang terbaru`}
            >
              <div class="overflow-x-auto">
                <table class="w-full min-w-[620px] border-collapse text-sm">
                  <thead>
                    <tr class="text-left text-xs uppercase tracking-wide text-content-muted">
                      <th class="border-b border-border px-3 py-2 font-semibold">
                        Tugas
                      </th>
                      <th class="border-b border-border px-3 py-2 font-semibold">
                        Mapel
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
                    {(child.grades ?? []).slice(0, 12).map((row) => (
                      <tr key={row.id} class="border-b border-border align-top">
                        <td class="px-3 py-2 font-medium text-content">
                          {row.title}
                        </td>
                        <td class="whitespace-nowrap px-3 py-2 text-xs text-content-muted">
                          {row.subjectName}
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
            </Card>
          )}

          {(child.history?.length ?? 0) > 0 && (
            <Card
              title="Rekap Kehadiran"
              description={`Kehadiran ${child.name} — ${child.history?.length} catatan terakhir`}
            >
              <div class="overflow-x-auto">
                <table class="w-full min-w-[560px] border-collapse text-sm">
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
                    {(child.history ?? []).slice(0, 15).map((row) => (
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
            </Card>
          )}
        </>
      )}
    </div>
  );
}
