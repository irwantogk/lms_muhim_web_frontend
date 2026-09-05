import type { RoleTone } from "@/lib/types.ts";
import type { ProgressMapel } from "@/lib/laporan/types.ts";
import { formatDecimal } from "@/lib/laporan/format.ts";

const TONE_CYCLE: RoleTone[] = ["murid", "guru", "ortu", "admin", "primary"];

const GUIDE_LEVELS = [0, 25, 50, 75, 100];

interface ChartDatum {
  code: string;
  label: string;
  /** Nilai skala 0–100, null berarti tidak ada data. */
  value: number | null;
  /** Teks di atas batang. */
  display: string;
  hasData: boolean;
}

function toneAt(index: number): RoleTone {
  return TONE_CYCLE[index % TONE_CYCLE.length];
}

/** Warna solid batang (Tailwind literal) per nada peran. */
const BAR_SOLID: Record<RoleTone, string> = {
  primary: "bg-primary",
  admin: "bg-role-admin",
  guru: "bg-role-guru",
  murid: "bg-role-murid",
  ortu: "bg-role-ortu",
};

function BarChart({
  data,
  heightClass = "h-36",
}: {
  data: ChartDatum[];
  heightClass?: string;
}) {
  return (
    <div class="overflow-x-auto">
      <div class="min-w-max px-1">
        {/* Label nilai di atas batang */}
        <div class="flex items-end gap-3 sm:gap-4">
          {data.map((item) => (
            <div
              key={item.code}
              class={`w-12 text-center text-[10px] font-semibold tabular-nums sm:w-16 ${
                item.hasData ? "text-content" : "text-content-muted"
              }`}
            >
              {item.display}
            </div>
          ))}
        </div>

        {/* Area batang dengan garis panduan 0–100 */}
        <div class={`relative mt-1 ${heightClass}`}>
          {GUIDE_LEVELS.map((level) => (
            <div
              key={level}
              class="absolute inset-x-0 border-t border-border/50"
              style={{ bottom: `${level}%` }}
            />
          ))}
          <div class="absolute inset-0 flex items-end gap-3 sm:gap-4">
            {data.map((item, index) => {
              const value = Math.max(0, Math.min(100, item.value ?? 0));
              const color = item.hasData
                ? BAR_SOLID[toneAt(index)]
                : "bg-surface-muted";
              return (
                <div
                  key={item.code}
                  class="flex h-full w-12 items-end justify-center sm:w-16"
                >
                  <div
                    class={`w-full max-w-10 rounded-t-md ${color}`}
                    style={{
                      height: `${item.hasData ? value : 2}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Kode mapel di bawah sumbu */}
        <div class="mt-1 flex items-start gap-3 sm:gap-4">
          {data.map((item) => (
            <div
              key={item.code}
              class="w-12 text-center text-xs font-medium text-content-muted sm:w-16"
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface ProgressChartsProps {
  rows: ProgressMapel[];
  emptyMessage?: string;
}

/**
 * Seksi grafik progres belajar: batang rata-rata nilai dan batang
 * penyelesaian tugas per mata pelajaran (skala 0–100).
 */
export function ProgressCharts({
  rows,
  emptyMessage = "Belum ada data untuk digambar.",
}: ProgressChartsProps) {
  if (rows.length === 0) {
    return (
      <p class="py-6 text-center text-sm text-content-muted">
        {emptyMessage}
      </p>
    );
  }

  const nilaiData: ChartDatum[] = rows.map((row) => ({
    code: row.subjectCode,
    label: row.subjectCode,
    value: row.avgScore,
    display: row.avgScore == null ? "—" : formatDecimal(row.avgScore),
    hasData: row.avgScore != null,
  }));

  const taskData: ChartDatum[] = rows.map((row) => {
    const percent = row.totalTasks === 0
      ? 0
      : Math.round((row.doneTasks / row.totalTasks) * 100);
    return {
      code: row.subjectCode,
      label: row.subjectCode,
      value: percent,
      display: row.totalTasks === 0 ? "—" : `${percent}%`,
      hasData: row.totalTasks > 0,
    };
  });

  return (
    <div class="grid gap-6 lg:grid-cols-2">
      <section>
        <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="text-sm font-semibold text-content">
            Rata-rata Nilai per Mapel
          </h3>
          <span class="text-xs text-content-muted">skala 0–100</span>
        </div>
        <BarChart data={nilaiData} />
      </section>

      <section>
        <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="text-sm font-semibold text-content">
            Penyelesaian Tugas per Mapel
          </h3>
          <span class="text-xs text-content-muted">
            tugas dikerjakan / total ({rows.length} mapel)
          </span>
        </div>
        <BarChart data={taskData} />
      </section>
    </div>
  );
}
