import type {
  AttendanceOption,
  AttendanceSession,
} from "../../lib/server/backend.ts";
import { Card } from "../ui/Card.tsx";
import CopyCode from "../../islands/CopyCode.tsx";

export interface GuruCodePanelProps {
  options: AttendanceOption[];
  sessions: AttendanceSession[];
  error: string | null;
}

function timeLabel(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isActive(session: AttendanceSession): boolean {
  return new Date(session.expiresAt).getTime() > Date.now();
}

function latestActive(sessions: AttendanceSession[]): AttendanceSession | null {
  const active = sessions.filter(isActive);
  if (active.length === 0) return null;
  return active.reduce((latest, session) =>
    session.createdAt > latest.createdAt ? session : latest
  );
}

function CloseForm(
  { sessionId, kind }: { sessionId: string; kind: "hero" | "row" },
) {
  return (
    <form method="post" action="/kehadiran">
      <input type="hidden" name="action" value="close" />
      <input type="hidden" name="sessionId" value={sessionId} />
      {kind === "hero"
        ? (
          <button
            type="submit"
            class="w-full rounded-md bg-status-sakit px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-status-sakit/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-sakit/40"
          >
            Tutup Sesi
          </button>
        )
        : (
          <button
            type="submit"
            class="inline-flex items-center rounded-md border border-status-sakit/40 px-2 py-0.5 text-[10px] font-semibold text-status-sakit transition-colors hover:bg-status-sakit/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-sakit/40"
          >
            Tutup
          </button>
        )}
    </form>
  );
}

export function GuruCodePanel({
  options,
  sessions,
  error,
}: GuruCodePanelProps) {
  const activeSession = latestActive(sessions);

  return (
    <div class="grid gap-4">
      <Card
        title="Kode Absensi Kelas"
        description="Buat & kelola sesi yang dipindai murid"
      >
        {error && (
          <div
            role="alert"
            class="mb-4 rounded-md border border-status-sakit/30 bg-status-sakit/10 px-3 py-2 text-sm text-status-sakit"
          >
            {error}
          </div>
        )}

        {/* Kode aktif yang sedang berlangsung */}
        {activeSession && (
          <div class="mb-4 rounded-lg border border-role-guru/50 bg-gradient-to-br from-role-guru/15 to-role-murid/10 p-4">
            <p class="text-center text-xs font-semibold uppercase tracking-wide text-role-guru">
              Kode aktif sekarang
            </p>
            <p class="mt-2 text-center font-mono text-4xl font-bold tracking-[0.25em] text-content">
              {activeSession.code}
            </p>
            <p class="mt-2 text-center text-xs text-content-muted">
              {activeSession.className} • {activeSession.subjectName}
            </p>
            <p class="text-center text-xs text-content-muted">
              Berlaku sampai {timeLabel(activeSession.expiresAt)}
            </p>
            <div class="mt-3 flex flex-col gap-2 sm:flex-row">
              <a
                href={`/kehadiran/layar/${activeSession.code}`}
                class="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Layar penuh
              </a>
              <CopyCode
                value={activeSession.code}
                label="Salin kode"
                className="inline-flex flex-1 items-center justify-center rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-semibold text-content transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
            <div class="mt-2">
              <CloseForm sessionId={activeSession.id} kind="hero" />
            </div>
          </div>
        )}

        <form method="post" action="/kehadiran" class="space-y-3">
          <div>
            <label
              class="block text-xs font-medium text-content"
              for="guru-pair"
            >
              Kelas & mata pelajaran
            </label>
            <select
              id="guru-pair"
              name="pair"
              required
              class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {options.length === 0 && (
                <option value="">Belum ada kelas/mapel yang diampu</option>
              )}
              {options.map((option) => (
                <option
                  key={`${option.classId}:${option.subjectId}`}
                  value={`${option.classId}:${option.subjectId}`}
                >
                  {option.className} — {option.subjectName}{" "}
                  ({option.subjectCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              class="block text-xs font-medium text-content"
              for="guru-minutes"
            >
              Kode berlaku selama
            </label>
            <select
              id="guru-minutes"
              name="validMinutes"
              class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <option value="15">15 menit</option>
              <option value="30">30 menit</option>
              <option value="60" selected>
                60 menit
              </option>
              <option value="120">2 jam</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={options.length === 0}
            class="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Buat sesi baru
          </button>
        </form>

        {sessions.length > 0 && (
          <div class="mt-4 border-t border-border pt-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-content-muted">
              Riwayat sesi hari ini
            </p>
            <ul class="mt-2 space-y-2">
              {sessions.map((session) => {
                const active = isActive(session);
                return (
                  <li
                    key={session.id}
                    class="rounded-md border border-border bg-surface-subtle px-2.5 py-2"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate text-xs font-medium text-content">
                          {session.className} • {session.subjectName}
                        </p>
                        <p class="text-[11px] text-content-muted">
                          dibuat {timeLabel(session.createdAt)} • s/d{" "}
                          {timeLabel(session.expiresAt)}
                        </p>
                      </div>
                      <code class="shrink-0 font-mono text-sm font-bold tracking-widest text-content">
                        {session.code}
                      </code>
                    </div>
                    <div class="mt-1.5 flex items-center justify-between">
                      <span
                        class={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          active
                            ? "bg-status-hadir/10 text-status-hadir"
                            : "bg-surface-muted text-content-muted"
                        }`}
                      >
                        {active ? "Aktif" : "Ditutup / kedaluwarsa"}
                      </span>
                      {active && (
                        <CloseForm sessionId={session.id} kind="row" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
