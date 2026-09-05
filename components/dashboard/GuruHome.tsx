import type { DashboardData } from "../../lib/types.ts";
import { Badge } from "../ui/Badge.tsx";
import { Card } from "../ui/Card.tsx";

export function GuruHome({ data }: { data: DashboardData }) {
  const guru = data.guru;
  if (!guru) return null;

  return (
    <div class="grid gap-6 lg:grid-cols-2">
      <Card
        title="Jadwal Mengajar Hari Ini"
        description="Sesi kelas beserta kode absensi presensi"
      >
        {guru.sessions.length === 0
          ? (
            <p class="py-4 text-center text-sm text-content-muted">
              Tidak ada sesi mengajar hari ini.
            </p>
          )
          : (
            <ul class="divide-y divide-border">
              {guru.sessions.map((session) => (
                <li key={session.id} class="py-3">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex min-w-0 items-center gap-3">
                      <span class="w-16 shrink-0 rounded-md bg-surface-muted px-2 py-1 text-center text-xs font-medium text-content-muted">
                        {session.time}
                      </span>
                      <div class="min-w-0">
                        <p class="truncate font-medium text-content">
                          {session.subjectName}
                        </p>
                        <p class="text-xs text-content-muted">
                          {session.className}
                        </p>
                      </div>
                    </div>
                    <Badge tone="guru">
                      {session.present}/{session.total} hadir
                    </Badge>
                  </div>
                  <div class="mt-2 flex items-center gap-2">
                    <span class="text-xs text-content-muted">
                      Kode presensi
                    </span>
                    <code class="rounded-md border border-dashed border-border-strong bg-surface-muted px-2 py-0.5 font-mono text-xs font-semibold tracking-widest text-content">
                      {session.code}
                    </code>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </Card>

      <Card
        title="Perlu Dinilai"
        description="Tugas yang sudah dikumpulkan murid dan belum dikoreksi"
      >
        {guru.toGrade.length === 0
          ? (
            <p class="py-4 text-center text-sm text-content-muted">
              Tidak ada kiriman menunggu penilaian.
            </p>
          )
          : (
            <ul class="divide-y divide-border">
              {guru.toGrade.map((task) => (
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
                  <span class="shrink-0 rounded-full bg-role-ortu/10 px-2.5 py-1 text-xs font-semibold text-role-ortu">
                    {task.pending} menunggu
                  </span>
                </li>
              ))}
            </ul>
          )}
      </Card>
    </div>
  );
}
