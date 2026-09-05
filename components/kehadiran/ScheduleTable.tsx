import type { ScheduleDay } from "../../lib/server/backend.ts";
import { phasesForToday, todayMarker } from "../../lib/scheduleTime.ts";
import type { SessionPhase } from "../../lib/scheduleTime.ts";

export interface ScheduleTableProps {
  week: ScheduleDay[];
}

const PHASE_LABEL: Partial<Record<SessionPhase, string>> = {
  current: "Berlangsung",
  next: "Berikutnya",
  done: "Selesai",
};

const PHASE_CHIP: Partial<Record<SessionPhase, string>> = {
  current: "bg-status-hadir/10 text-status-hadir",
  next: "bg-status-terlambat/10 text-status-terlambat",
  done: "bg-surface-muted text-content-muted",
};

const PHASE_BOX: Partial<Record<SessionPhase, string>> = {
  current: "border-status-hadir/50 bg-status-hadir/5",
  next: "border-status-terlambat/40 bg-status-terlambat/5",
  done: "opacity-60",
};

function dayPhaseMap(
  sessions: ScheduleDay["sessions"],
): Map<string, SessionPhase> {
  const map = new Map<string, SessionPhase>();
  for (const item of phasesForToday(sessions)) {
    map.set(
      `${item.session.startTime}-${item.session.subjectCode}`,
      item.phase,
    );
  }
  return map;
}

/** Daftar jadwal per hari (tampilan layar kecil / mobile). */
function DayScheduleList({ week }: ScheduleTableProps) {
  const todayDay = week.find((day) => day.isToday);
  const todaySessions = todayDay?.sessions ?? [];
  const phaseByKey = dayPhaseMap(todaySessions);

  const ordered = [...week].sort((a, b) =>
    Number(b.isToday) - Number(a.isToday) || a.day - b.day
  );

  return (
    <div class="space-y-3">
      {ordered.map((day) => (
        <section
          key={day.day}
          class={`rounded-lg border p-3 ${
            day.isToday
              ? "border-primary/40 bg-primary/5"
              : "border-border bg-surface-subtle"
          }`}
        >
          <header class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-content">{day.label}</h3>
            <span class="flex items-center gap-2">
              {day.isToday && (
                <span class="inline-flex rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                  hari ini
                </span>
              )}
              <span class="text-xs text-content-muted">
                {day.sessions.length} sesi
              </span>
            </span>
          </header>

          {day.sessions.length === 0
            ? (
              <p class="text-sm text-content-muted/70">
                Tidak ada pelajaran.
              </p>
            )
            : (
              <ul class="space-y-1.5">
                {day.sessions.map((session) => {
                  const phase = day.isToday
                    ? phaseByKey.get(
                      `${session.startTime}-${session.subjectCode}`,
                    )
                    : undefined;
                  const current = phase === "current";
                  const next = phase === "next";
                  const done = phase === "done";
                  return (
                    <li
                      key={`${day.day}-${session.startTime}-${session.subjectCode}`}
                      class={`flex items-start gap-2 rounded-md border px-2.5 py-2 ${
                        current
                          ? "border-status-hadir/40 bg-status-hadir/10"
                          : next
                          ? "border-status-terlambat/40 bg-status-terlambat/10"
                          : done
                          ? "border-border bg-surface opacity-70"
                          : "border-border bg-surface"
                      }`}
                    >
                      <span class="mt-0.5 shrink-0 rounded bg-surface-muted px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums leading-relaxed text-content-muted">
                        {session.startTime}
                        <br />
                        {session.endTime}
                      </span>
                      <div class="min-w-0 flex-1">
                        <p class="flex flex-wrap items-center gap-1.5 text-sm font-medium text-content">
                          <span>{session.subjectName}</span>
                          <span class="inline-flex items-center rounded bg-role-guru/10 px-1 py-0.5 text-[10px] font-bold text-role-guru">
                            {session.subjectCode}
                          </span>
                          {phase && phase !== "upcoming" && (
                            <span
                              class={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold ${
                                PHASE_CHIP[phase] ?? ""
                              }`}
                            >
                              {PHASE_LABEL[phase]}
                            </span>
                          )}
                        </p>
                        <p class="truncate text-[11px] text-content-muted">
                          {session.className} • {session.teacherName}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
        </section>
      ))}
    </div>
  );
}

export function ScheduleTable({ week }: ScheduleTableProps) {
  const todayDay = week.find((day) => day.isToday);
  const todaySessions = todayDay?.sessions ?? [];
  const marker = todayMarker(todaySessions);

  const phaseKey = (day: ScheduleDay, start: string, code: string) =>
    day.isToday ? `${start}-${code}` : "";

  const phaseByKey = new Map<string, SessionPhase>();
  for (const item of phasesForToday(todaySessions)) {
    phaseByKey.set(
      `${item.session.startTime}-${item.session.subjectCode}`,
      item.phase,
    );
  }

  const times = [
    ...new Set(
      week.flatMap((day) => day.sessions.map((s) => s.startTime)),
    ),
  ].sort();

  return (
    <div>
      {todayDay && todaySessions.length > 0 && marker &&
        marker.kind !== "done" && (
        <div
          class={`mb-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
            marker.kind === "current"
              ? "border-status-hadir/40 bg-status-hadir/10 text-status-hadir"
              : "border-status-terlambat/40 bg-status-terlambat/10 text-status-terlambat"
          }`}
        >
          <span
            class={`h-2 w-2 shrink-0 rounded-full ${
              marker.kind === "current"
                ? "bg-status-hadir"
                : "bg-status-terlambat"
            }`}
            aria-hidden="true"
          />
          {marker.kind === "current"
            ? (
              <span>
                <strong>Sedang berlangsung</strong> —{" "}
                {marker.session?.subjectName} ({marker.session?.startTime}–
                {marker.session?.endTime})
              </span>
            )
            : (
              <span>
                <strong>Sesi berikutnya</strong> — {marker.session?.subjectName}
                {" "}
                pukul {marker.session?.startTime}
              </span>
            )}
        </div>
      )}

      {todayDay && todaySessions.length > 0 && marker?.kind === "done" && (
        <p class="mb-3 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-content-muted">
          Semua pelajaran hari ini telah selesai.
        </p>
      )}

      <div class="md:hidden">
        <DayScheduleList week={week} />
      </div>

      <div class="hidden overflow-x-auto md:block">
        <table class="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                class="sticky left-0 border border-border bg-surface-muted px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-content-muted"
              >
                Jam
              </th>
              {week.map((day) => (
                <th
                  key={day.day}
                  scope="col"
                  class={`border border-border px-2 py-2 text-center text-xs font-semibold ${
                    day.isToday
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-muted text-content-muted"
                  }`}
                >
                  {day.label}
                  {day.isToday && (
                    <span class="ml-1 inline-block rounded bg-primary px-1 text-[10px] font-bold text-white">
                      hari ini
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.length === 0 && (
              <tr>
                <td
                  colspan={week.length + 1}
                  class="border border-border px-3 py-8 text-center text-sm text-content-muted"
                >
                  Tidak ada jadwal pelajaran minggu ini.
                </td>
              </tr>
            )}
            {times.map((start) => (
              <tr key={start}>
                <th
                  scope="row"
                  class="sticky left-0 border border-border bg-surface-muted px-2 py-2 text-xs font-semibold tabular-nums text-content-muted"
                >
                  {start}
                </th>
                {week.map((day) => {
                  const sessions = day.sessions.filter(
                    (s) => s.startTime === start,
                  );
                  const highlight = day.isToday;
                  return (
                    <td
                      key={day.day}
                      class={`border border-border px-1.5 py-1.5 align-top ${
                        highlight ? "bg-primary/5" : ""
                      }`}
                    >
                      {sessions.length === 0
                        ? (
                          <span class="block px-1 text-xs text-content-muted/50">
                            —
                          </span>
                        )
                        : (
                          <div class="flex flex-col gap-1">
                            {sessions.map((session) => {
                              const phase = day.isToday
                                ? phaseByKey.get(
                                  phaseKey(day, start, session.subjectCode),
                                )
                                : undefined;
                              return (
                                <div
                                  key={`${day.day}-${start}-${session.subjectCode}`}
                                  class={`rounded-md border px-1.5 py-1 ${
                                    PHASE_BOX[phase ?? "upcoming"] ??
                                      "border-border bg-surface"
                                  }`}
                                >
                                  <p class="flex items-center justify-between gap-1">
                                    <span class="inline-flex items-center rounded bg-role-guru/10 px-1 py-0.5 text-[10px] font-bold text-role-guru">
                                      {session.subjectCode}
                                    </span>
                                    {phase && phase !== "upcoming" && (
                                      <span
                                        class={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold ${
                                          PHASE_CHIP[phase] ?? ""
                                        }`}
                                      >
                                        {PHASE_LABEL[phase]}
                                      </span>
                                    )}
                                    <span class="text-[10px] tabular-nums text-content-muted">
                                      {session.startTime}-{session.endTime}
                                    </span>
                                  </p>
                                  <p class="mt-0.5 text-xs font-medium leading-snug text-content">
                                    {session.subjectName}
                                  </p>
                                  <p class="truncate text-[10px] text-content-muted">
                                    {session.className} • {session.teacherName}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-content-muted">
        <span class="inline-flex items-center gap-1">
          <span
            class="h-2 w-2 rounded-full bg-status-hadir"
            aria-hidden="true"
          />
          Berlangsung
        </span>
        <span class="inline-flex items-center gap-1">
          <span
            class="h-2 w-2 rounded-full bg-status-terlambat"
            aria-hidden="true"
          />
          Berikutnya
        </span>
        <span class="inline-flex items-center gap-1">
          <span
            class="h-2 w-2 rounded-full bg-content-muted/50"
            aria-hidden="true"
          />
          Selesai
        </span>
      </div>
    </div>
  );
}
