import type { DashboardData } from "../../lib/types.ts";
import { ATTENDANCE_LABEL } from "../ui/Badge.tsx";
import { Badge } from "../ui/Badge.tsx";
import { Card } from "../ui/Card.tsx";
import { assignmentTypeLabel } from "../../lib/api/assignments.ts";

function deadlineText(daysLeft: number): string {
  if (daysLeft <= 0) return "Tenggat hari ini";
  if (daysLeft === 1) return "Tenggat besok";
  return `${daysLeft} hari lagi`;
}

export function MuridHome({ data }: { data: DashboardData }) {
  const murid = data.murid;
  if (!murid) return null;
  const summary = murid.attendanceSummary;

  return (
    <div class="grid gap-6 lg:grid-cols-2">
      <Card
        title="Kehadiran & Jadwal Hari Ini"
        description={summary.totalSessions === 0
          ? "Tidak ada jadwal pelajaran hari ini."
          : `Sesi terpresensi ${
            summary.hadir + summary.terlambat
          } dari ${summary.totalSessions} jadwal.`}
        action={
          <Badge tone={summary.overall}>
            {ATTENDANCE_LABEL[summary.overall]}
          </Badge>
        }
      >
        {murid.attendance.length === 0
          ? (
            <p class="py-4 text-center text-sm text-content-muted">
              Libur akhir pekan — tidak ada sesi hari ini.
            </p>
          )
          : (
            <ul class="divide-y divide-border">
              {murid.attendance.map((record) => (
                <li
                  key={record.id}
                  class="flex items-center justify-between gap-4 py-3"
                >
                  <div class="flex min-w-0 items-center gap-3">
                    <span class="w-16 shrink-0 rounded-md bg-surface-muted px-2 py-1 text-center text-xs font-medium text-content-muted">
                      {record.time}
                    </span>
                    <div class="min-w-0">
                      <p class="truncate font-medium text-content">
                        {record.subjectName}
                      </p>
                      <p class="text-xs text-content-muted">
                        {record.className}
                      </p>
                    </div>
                  </div>
                  <Badge tone={record.status}>
                    {ATTENDANCE_LABEL[record.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
      </Card>

      <Card
        title="Tugas Mendekati Tenggat"
        description="Prioritaskan yang paling dekat dengan batas waktu"
      >
        {murid.assignments.length === 0
          ? (
            <p class="py-4 text-center text-sm text-content-muted">
              Tidak ada tugas terbuka.
            </p>
          )
          : (
            <ul class="divide-y divide-border">
              {murid.assignments.map((task) => (
                <li
                  key={task.id}
                  class="flex items-center justify-between gap-4 py-3"
                >
                  <div class="min-w-0">
                    <p class="truncate font-medium text-content">
                      {task.title}
                    </p>
                    <p class="text-xs text-content-muted">
                      {task.subjectName} • {task.className}
                    </p>
                  </div>
                  <div class="shrink-0 text-right">
                    <Badge
                      tone={task.type === "pilihan_ganda"
                        ? "murid"
                        : task.type === "esai"
                        ? "guru"
                        : "ortu"}
                    >
                      {assignmentTypeLabel(task.type)}
                    </Badge>
                    <p class="mt-1 text-xs text-content-muted">
                      {deadlineText(task.daysLeft)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </Card>
    </div>
  );
}
