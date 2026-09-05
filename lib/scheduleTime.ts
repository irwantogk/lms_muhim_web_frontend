export type SessionPhase = "done" | "current" | "next" | "upcoming";

export interface TimedSession {
  startTime: string;
  endTime: string;
}

function toMinutes(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export interface PhaseSession<T extends TimedSession> {
  session: T;
  phase: SessionPhase;
}

/** Klasifikasi sesi pada hari ini: selesai / sedang berlangsung / berikutnya / mendatang. */
export function phasesForToday<T extends TimedSession>(
  sessions: T[],
  now = new Date(),
): PhaseSession<T>[] {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const sorted = [...sessions].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  let nextMarked = false;
  return sorted.map((session) => {
    const start = toMinutes(session.startTime);
    const end = toMinutes(session.endTime);

    if (start <= nowMinutes && nowMinutes < end) {
      return { session, phase: "current" as const };
    }
    if (end <= nowMinutes) {
      return { session, phase: "done" as const };
    }
    if (!nextMarked) {
      nextMarked = true;
      return { session, phase: "next" as const };
    }
    return { session, phase: "upcoming" as const };
  });
}

export interface TodayMarker<T extends TimedSession> {
  kind: "current" | "next" | "done" | "none";
  session: T | null;
}

/** Ringkasan singkat kondisi jadwal hari ini (sesi yang sedang/berikutnya). */
export function todayMarker<T extends TimedSession>(
  sessions: T[],
  now = new Date(),
): TodayMarker<T> | null {
  const phases = phasesForToday(sessions, now);
  if (phases.length === 0) return null;

  const current = phases.find((p) => p.phase === "current");
  if (current) {
    return { kind: "current", session: current.session };
  }
  const next = phases.find((p) => p.phase === "next");
  if (next) {
    return { kind: "next", session: next.session };
  }
  return { kind: "done", session: null };
}
