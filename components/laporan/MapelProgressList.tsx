import type { RoleTone } from "@/lib/types.ts";
import type { ProgressMapel } from "@/lib/laporan/types.ts";
import { formatDecimal } from "@/lib/laporan/format.ts";
import { ProgressBar } from "@/components/ui/ProgressBar.tsx";

const TONE_CYCLE: RoleTone[] = ["murid", "guru", "ortu", "admin", "primary"];

export interface MapelProgressListProps {
  rows: ProgressMapel[];
  emptyMessage?: string;
}

/** Daftar progres per mapel: rata-rata nilai + batang penyelesaian tugas. */
export function MapelProgressList({
  rows,
  emptyMessage = "Belum ada data progres per mapel.",
}: MapelProgressListProps) {
  if (rows.length === 0) {
    return (
      <p class="py-8 text-center text-sm text-content-muted">{emptyMessage}</p>
    );
  }

  return (
    <ul class="divide-y divide-border">
      {rows.map((row, index) => {
        const tone = TONE_CYCLE[index % TONE_CYCLE.length];
        return (
          <li key={row.subjectCode} class="py-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="min-w-0">
                <p class="font-medium text-content">{row.subjectName}</p>
                <p class="text-xs text-content-muted">
                  {row.subjectCode} • {row.doneTasks}/{row.totalTasks}{" "}
                  tugas dikerjakan
                </p>
              </div>
              {row.avgScore == null
                ? (
                  <span class="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-content-muted">
                    Belum dinilai
                  </span>
                )
                : (
                  <span class="rounded-full bg-role-ortu/10 px-2.5 py-0.5 text-sm font-bold text-role-ortu">
                    {formatDecimal(row.avgScore)}
                  </span>
                )}
            </div>
            <ProgressBar
              value={row.doneTasks}
              max={row.totalTasks}
              tone={tone}
              class="mt-2"
            />
          </li>
        );
      })}
    </ul>
  );
}
