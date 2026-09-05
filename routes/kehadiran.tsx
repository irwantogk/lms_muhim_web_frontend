import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import type {
  AttendanceRecordItem,
  AttendanceSnapshot,
  Role,
} from "@/lib/types.ts";
import { ROLE_META } from "@/lib/roles.ts";
import { getMuridAttendance } from "@/lib/api/attendance.ts";
import { buildDashboardData } from "@/lib/server/dashboard.ts";
import {
  ApiError,
  type AttendanceOption,
  type AttendanceSession,
  closeAttendanceSession,
  createAttendanceSession,
  getAttendanceOptions,
  getTodaySessions,
  getWeeklySchedule,
  scanAttendanceSession,
  type ScheduleClassOption,
  type ScheduleDay,
} from "@/lib/server/backend.ts";
import { greetingForHour, toDateLabel } from "@/lib/date.ts";
import {
  type ScanFeedback,
  scanFeedbackFromParam,
  scanKindFromErrorCode,
} from "@/lib/scanFeedback.ts";
import { Card } from "@/components/ui/Card.tsx";
import { ScheduleTable } from "@/components/kehadiran/ScheduleTable.tsx";
import { ClassSwitcher } from "@/components/kehadiran/ClassSwitcher.tsx";
import { GuruCodePanel } from "@/components/kehadiran/GuruCodePanel.tsx";
import { MuridScanPanel } from "@/components/kehadiran/MuridScanPanel.tsx";

interface KehadiranData {
  role: Role;
  userName: string;
  roleLabel: string;
  greeting: string;
  dateLabel: string;
  classId: string;
  className: string;
  week: ScheduleDay[];
  classTabs: Array<{ id: string; name: string; isCurrent: boolean }>;
  guruOptions?: AttendanceOption[];
  guruSessions?: AttendanceSession[];
  error: string | null;
  scanSuccess: string | null;
  scanFeedback: ScanFeedback | null;
  muridSummary?: AttendanceSnapshot;
  muridRecords?: AttendanceRecordItem[];
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    const now = new Date();
    const url = new URL(ctx.req.url);

    const role = session.user.role;
    const requested = url.searchParams.get("class") ?? undefined;

    const data: KehadiranData = {
      role,
      userName: session.user.name,
      roleLabel: ROLE_META[role].label,
      greeting: greetingForHour(now),
      dateLabel: toDateLabel(now),
      classId: "",
      className: "",
      week: [],
      classTabs: [],
      error: url.searchParams.get("error"),
      scanSuccess: url.searchParams.get("ok"),
      scanFeedback: scanFeedbackFromParam(url.searchParams.get("scanError")),
    };

    try {
      const weekly = await getWeeklySchedule(session.accessToken, requested);
      data.classId = weekly.currentClassId ?? "";
      data.className = weekly.currentClassName ?? "";
      data.week = weekly.days;
      data.classTabs = weekly.availableClasses.map(
        (c: ScheduleClassOption) => ({
          id: c.id,
          name: c.name,
          isCurrent: c.id === weekly.currentClassId,
        }),
      );
    } catch (error) {
      data.error = error instanceof Error
        ? error.message
        : "Gagal memuat jadwal pelajaran";
    }

    if (role === "guru") {
      try {
        data.guruOptions = await getAttendanceOptions(session.accessToken);
        data.guruSessions = await getTodaySessions(session.accessToken);
      } catch (error) {
        data.error = error instanceof Error
          ? error.message
          : "Gagal memuat data absensi";
      }
    }
    if (role === "murid") {
      try {
        const dash = await buildDashboardData(
          session.user,
          session.accessToken,
        );
        if (dash.murid) {
          data.muridSummary = dash.murid.attendanceSummary;
          data.muridRecords = dash.murid.attendance;
        }
      } catch {
        const { records, summary } = getMuridAttendance("m1");
        data.muridRecords = records;
        data.muridSummary = summary;
      }
    }

    return page(data);
  },

  async POST(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");

    const form = await ctx.req.formData();
    const action = String(form.get("action") ?? "");

    if (action === "close") {
      if (session.user.role !== "guru") {
        return ctx.redirect(
          "/kehadiran?error=Hanya+peran+guru+yang+dapat+menutup+sesi",
        );
      }
      const sessionId = String(form.get("sessionId") ?? "").trim();
      if (!sessionId) {
        return ctx.redirect("/kehadiran?error=Sesi+tidak+dikenali");
      }
      try {
        await closeAttendanceSession(session.accessToken, sessionId);
        return ctx.redirect("/kehadiran");
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : "Gagal menutup sesi";
        const params = new URLSearchParams({ error: message });
        return ctx.redirect(`/kehadiran?${params.toString()}`);
      }
    }

    if (action === "scan") {
      if (session.user.role !== "murid") {
        return ctx.redirect(
          "/kehadiran?error=Hanya+peran+murid+yang+dapat+absensi+hadir",
        );
      }
      const code = String(form.get("code") ?? "").trim();
      if (!code) {
        return ctx.redirect("/kehadiran?error=Masukkan+kode+presensi");
      }
      try {
        await scanAttendanceSession(session.accessToken, code);
        const params = new URLSearchParams({ ok: code });
        return ctx.redirect(`/kehadiran?${params.toString()}`);
      } catch (error) {
        const kind = scanKindFromErrorCode(
          error instanceof ApiError ? error.code : undefined,
        );
        return ctx.redirect(`/kehadiran?scanError=${kind}`);
      }
    }

    if (session.user.role !== "guru") {
      return ctx.redirect(
        "/kehadiran?error=Hanya+peran+guru+yang+dapat+membuat+kode",
      );
    }

    const pair = String(form.get("pair") ?? "");
    const [classId, subjectId] = pair.split(":");
    const validMinutes = Number(form.get("validMinutes") ?? 60);

    if (!classId || !subjectId) {
      return ctx.redirect(
        "/kehadiran?error=Kelas+dan+mata+pelajaran+wajib+dipilih",
      );
    }

    try {
      await createAttendanceSession(session.accessToken, {
        classId,
        subjectId,
        validMinutes: Number.isFinite(validMinutes) ? validMinutes : 60,
      });
      const params = new URLSearchParams({ class: classId });
      return ctx.redirect(`/kehadiran?${params.toString()}`);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Gagal membuat kode";
      const params = new URLSearchParams({ error: message });
      return ctx.redirect(`/kehadiran?${params.toString()}`);
    }
  },
});

export default define.page<typeof handler>(({ data }) => {
  const hasSidePanel = data.role === "guru" || data.role === "murid";

  return (
    <>
      <Head>
        <title>Kehadiran & Jadwal — SMA Muhammadiyah Imogiri</title>
      </Head>

      <section class="mb-6">
        <p class="text-sm text-content-muted">{data.dateLabel}</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
          Kehadiran & Jadwal
        </h1>
        <p class="mt-1 text-sm text-content-muted">
          <span class="font-semibold text-primary">{data.roleLabel}</span> —
          {" "}
          {data.greeting}, {data.userName.split(" ")[0]}
        </p>
      </section>

      <div class="mb-4">
        <ClassSwitcher classes={data.classTabs} />
      </div>

      <div class={`grid gap-6 ${hasSidePanel ? "lg:grid-cols-3" : ""}`}>
        <Card
          class={hasSidePanel ? "min-w-0 lg:col-span-2" : "min-w-0"}
          title={`Jadwal Pelajaran — ${
            data.className ||
            (data.role === "admin" ? "semua kelas" : "belum ada kelas")
          }`}
          description="Tabel jadwal mingguan (Senin–Jumat). Kolom hari ini ditandai."
        >
          <ScheduleTable week={data.week} />
        </Card>

        {hasSidePanel && (
          <div class="min-w-0">
            {data.role === "guru" && (
              <GuruCodePanel
                options={data.guruOptions ?? []}
                sessions={data.guruSessions ?? []}
                error={data.error}
              />
            )}
            {data.role === "murid" && data.muridSummary && (
              <MuridScanPanel
                summary={data.muridSummary}
                records={data.muridRecords ?? []}
                successCode={data.scanSuccess}
                feedback={data.scanFeedback}
              />
            )}
          </div>
        )}

        {!hasSidePanel && (
          <div class="grid gap-4">
            {data.role === "orang_tua" && (
              <Card title="Kehadiran Anak">
                <p class="text-sm text-content">
                  Ikuti jadwal kelas anak Anda di atas. Ringkasan kehadiran
                  harian & bulanan tersedia di Beranda.
                </p>
                <a
                  href="/"
                  class="mt-3 inline-flex items-center text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  Ke Beranda
                </a>
              </Card>
            )}
            {data.role === "admin" && (
              <Card title="Pantauan Umum">
                <p class="text-sm text-content">
                  Kelola kode sesi, kelas, dan rekap dari menu lain. Statistik
                  ringkas tersedia di Beranda.
                </p>
                <a
                  href="/"
                  class="mt-3 inline-flex items-center text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  Ke Beranda
                </a>
              </Card>
            )}
          </div>
        )}
      </div>

      <p class="mt-4 text-center text-xs text-content-muted">
        Form guru telah terhubung ke API; pemindaian kode oleh murid menyusul.
      </p>
    </>
  );
});
