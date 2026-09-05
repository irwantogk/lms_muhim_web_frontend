import type { DashboardData } from "../../lib/types.ts";
import { ATTENDANCE_LABEL, Badge } from "../ui/Badge.tsx";
import { Card } from "../ui/Card.tsx";
import { Avatar } from "../ui/Avatar.tsx";
import { ProgressBar } from "../ui/ProgressBar.tsx";

export function OrtuHome({ data }: { data: DashboardData }) {
  const ortu = data.ortu;
  if (!ortu) return null;

  return (
    <div class="grid gap-6">
      <Card
        title="Pantauan Anak"
        description="Ringkasan kehadiran dan progres belajar anak Anda"
      >
        {ortu.children.length === 0
          ? (
            <p class="py-4 text-center text-sm text-content-muted">
              Belum ada anak terhubung ke akun Anda.
            </p>
          )
          : (
            <ul class="grid gap-4">
              {ortu.children.map((child) => {
                const monthly = child.monthly;
                const today = child.today;
                const presentToday = today.hadir + today.terlambat;
                return (
                  <li
                    key={child.id}
                    class="flex flex-col gap-4 rounded-lg border border-border bg-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div class="flex items-center gap-3">
                      <Avatar name={child.name} size="lg" tone="ortu" />
                      <div>
                        <p class="font-semibold text-content">{child.name}</p>
                        <p class="text-sm text-content-muted">
                          {child.className}
                        </p>
                        <div class="mt-1 flex items-center gap-2">
                          <Badge tone={today.overall}>
                            Hari ini: {ATTENDANCE_LABEL[today.overall]}
                          </Badge>
                        </div>
                        {today.totalSessions > 0 && (
                          <p class="mt-1 text-xs text-content-muted">
                            {presentToday} dari {today.totalSessions}{" "}
                            sesi terpresensi
                          </p>
                        )}
                      </div>
                    </div>

                    <div class="grid w-full gap-4 sm:w-1/2 sm:grid-cols-3">
                      <div>
                        <p class="text-xs text-content-muted">
                          Kehadiran bulan ini
                        </p>
                        <p class="mt-0.5 text-sm font-medium text-content">
                          {monthly.hadir} hadir • {monthly.terlambat} terlambat
                        </p>
                        <p class="text-xs text-content-muted">
                          {monthly.izin} izin • {monthly.sakit} sakit
                        </p>
                      </div>
                      <div>
                        <p class="text-xs text-content-muted">
                          Nilai rata-rata
                        </p>
                        <p class="mt-0.5 text-sm font-semibold text-content">
                          {child.avgScore}
                        </p>
                      </div>
                      <div>
                        <p class="text-xs text-content-muted">Tugas selesai</p>
                        <p class="mt-0.5 text-sm font-medium text-content">
                          {child.taskDone}/{child.taskTotal}
                        </p>
                        <ProgressBar
                          value={child.taskDone}
                          max={child.taskTotal}
                          tone="ortu"
                          class="mt-1"
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
      </Card>
    </div>
  );
}
