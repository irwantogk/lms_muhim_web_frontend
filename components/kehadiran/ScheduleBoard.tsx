import type { WeekDay } from "../../lib/api/schedules.ts";

export interface ScheduleBoardProps {
  week: WeekDay[];
}

export function ScheduleBoard({ week }: ScheduleBoardProps) {
  return (
    <div class="overflow-x-auto">
      <div class="min-w-[720px]">
        {/* Header hari */}
        <div class="grid grid-cols-5 gap-2">
          {week.map((day) => (
            <div
              key={day.day}
              class={`rounded-lg border px-2 py-1.5 text-center text-xs font-semibold ${
                day.isToday
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface-muted text-content-muted"
              }`}
            >
              {day.isToday && (
                <span class="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
              )}
              {day.label}
            </div>
          ))}
        </div>

        {/* Kolom sesi per hari */}
        <div class="mt-2 grid grid-cols-5 items-start gap-2">
          {week.map((day) => (
            <div
              key={day.day}
              class={`min-h-40 rounded-lg border p-2 ${
                day.isToday
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-surface"
              }`}
            >
              {day.slots.length === 0
                ? (
                  <p class="flex h-full items-center justify-center px-2 text-center text-xs text-content-muted">
                    Tidak ada jadwal
                  </p>
                )
                : (
                  <ul class="flex flex-col gap-2">
                    {day.slots.map((slot) => (
                      <li
                        key={slot.scheduleId}
                        class="rounded-md border border-border bg-surface p-2"
                      >
                        <p class="flex items-center justify-between gap-1">
                          <span class="inline-flex items-center rounded bg-role-guru/10 px-1.5 py-0.5 text-[10px] font-bold text-role-guru">
                            {slot.subjectCode}
                          </span>
                          <span class="text-[10px] tabular-nums text-content-muted">
                            {slot.start}
                          </span>
                        </p>
                        <p class="mt-1 text-xs font-medium leading-snug text-content">
                          {slot.subjectName}
                        </p>
                        <p class="truncate text-[10px] text-content-muted">
                          {slot.teacherName}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
