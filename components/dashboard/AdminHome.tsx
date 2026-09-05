import type { DashboardData, WeeklyTrend } from "../../lib/types.ts";
import { Card } from "../ui/Card.tsx";
import { StatCard } from "../ui/StatCard.tsx";

function maxHadir(trend: WeeklyTrend[]): number {
  return Math.max(1, ...trend.map((day) => day.hadir));
}

function BarChart({ trend }: { trend: WeeklyTrend[] }) {
  const max = maxHadir(trend);
  return (
    <div>
      <div class="flex h-40 items-end gap-2 sm:gap-3">
        {trend.map((day) => {
          const hadir = Math.round((day.hadir / max) * 100);
          const terlambat = Math.round((day.terlambat / max) * 100);
          return (
            <div
              key={day.label}
              class="flex flex-1 flex-col items-center gap-1"
            >
              <span class="text-xs font-semibold tabular-nums text-content-muted">
                {day.hadir + day.terlambat}
              </span>
              <div
                class="flex w-full max-w-10 flex-col justify-end overflow-hidden rounded-t-md"
                style={{ height: "7.5rem" }}
              >
                <div
                  class="w-full bg-status-terlambat/80"
                  style={{ height: `${terlambat}%` }}
                  title={`Terlambat ${day.terlambat}`}
                />
                <div
                  class="w-full bg-role-murid"
                  style={{ height: `${hadir}%` }}
                  title={`Hadir ${day.hadir}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div class="mt-2 flex justify-between gap-2 sm:gap-3">
        {trend.map((day) => (
          <span
            key={day.label}
            class="flex-1 text-center text-xs text-content-muted"
          >
            {day.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdminHome({ data }: { data: DashboardData }) {
  const admin = data.admin;
  if (!admin) return null;

  return (
    <div class="grid gap-6">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {admin.stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            tone={stat.tone}
          />
        ))}
      </div>

      <Card
        title="Tren Kehadiran 7 Hari Terakhir"
        description="Jumlah murid hadir & terlambat per hari di seluruh kelas"
      >
        <BarChart trend={admin.weeklyTrend} />
        <div class="mt-4 flex flex-wrap gap-4 text-xs text-content-muted">
          <span class="inline-flex items-center gap-1.5">
            <span
              class="h-2.5 w-2.5 rounded-sm bg-role-murid"
              aria-hidden="true"
            />
            Hadir
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span
              class="h-2.5 w-2.5 rounded-sm bg-status-terlambat/80"
              aria-hidden="true"
            />
            Terlambat
          </span>
        </div>
      </Card>
    </div>
  );
}
