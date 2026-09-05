import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { ROLE_META } from "@/lib/roles.ts";
import { greetingForHour, toDateLabel } from "@/lib/date.ts";
import {
  getMuridProgressReport,
  getOrtuPantauan,
  getRekapReport,
  type MuridProgressReportApiData,
  type PantauanChildApi,
  type ProgressGradeApi,
  type ProgressHistoryApi,
  type ProgressMapelApi,
  type ProgressPresenceApi,
  type RekapReportApiData,
  type TaskKind,
} from "@/lib/server/backend.ts";
import type {
  AttendanceEntry,
  ChildProgress,
  ClassTabOption,
  ProgressMapel,
  RekapAbsenRow,
  RekapNilaiRow,
  ScoreEntry,
  SubjectOption,
} from "@/lib/laporan/types.ts";
import { recapAverage, recapPresence } from "@/lib/laporan/aggregate.ts";
import {
  formatDecimal,
  formatPercent,
  shortDateLabel,
} from "@/lib/laporan/format.ts";
import type {
  MuridReportData,
  PeriodeOption,
} from "@/components/laporan/MuridReport.tsx";
import { MuridReport } from "@/components/laporan/MuridReport.tsx";
import type { OrtuReportData } from "@/components/laporan/OrtuReport.tsx";
import { OrtuReport } from "@/components/laporan/OrtuReport.tsx";
import type { RekapReportProps } from "@/components/laporan/RekapReport.tsx";
import { RekapReport } from "@/components/laporan/RekapReport.tsx";

const TYPE_LABEL: Record<TaskKind, string> = {
  pilihan_ganda: "Pilihan Ganda",
  esai: "Esai",
  upload: "Unggah File",
  campuran: "Campuran (PG + Esai)",
};

const ZERO_PRESENCE = {
  hadir: 0,
  terlambat: 0,
  izin: 0,
  sakit: 0,
  opportunities: 0,
  presencePercent: 0,
};

// ---------------------------------------------------------------------------
// Pemetaan respons API -> model halaman
// ---------------------------------------------------------------------------
function presenceOf(presence: ProgressPresenceApi): typeof ZERO_PRESENCE {
  return {
    hadir: presence.hadir,
    terlambat: presence.terlambat,
    izin: presence.izin,
    sakit: presence.sakit,
    opportunities: presence.opportunities,
    presencePercent: presence.presencePercent,
  };
}

function progressMapelOf(mapel: ProgressMapelApi): ProgressMapel {
  return {
    subjectCode: mapel.subjectCode,
    subjectName: mapel.subjectName,
    totalTasks: mapel.totalTasks,
    doneTasks: mapel.doneTasks,
    avgScore: mapel.avgScore,
  };
}

function gradeFromApi(row: ProgressGradeApi): ScoreEntry {
  return {
    id: row.submissionId,
    title: row.title,
    className: row.className,
    subjectCode: row.subjectCode,
    subjectName: row.subjectName,
    taskTypeLabel: TYPE_LABEL[row.type] ?? "Tugas",
    score: row.score,
    feedback: row.feedback,
    submittedLabel: shortDateLabel(new Date(row.submittedAt)),
    submittedIso: row.submittedAt,
  };
}

function historyFromApi(row: ProgressHistoryApi): AttendanceEntry {
  return {
    id: row.id,
    dateLabel: shortDateLabel(new Date(row.dateIso)),
    dayLabel: row.dayLabel,
    subjectCode: row.subjectCode,
    subjectName: row.subjectName,
    teacherName: row.teacherName,
    status: row.status,
    dateIso: row.dateIso,
  };
}

// ---------------------------------------------------------------------------
// Rekap nilai & kehadiran (guru/admin)
// ---------------------------------------------------------------------------
type RekapPropsPartial = Omit<RekapReportProps, "title" | "csvPrefix">;

function rekapFromApi(
  data: RekapReportApiData,
  requestedSubject: string | null,
): RekapPropsPartial {
  const nilaiRows: RekapNilaiRow[] = data.nilai.map((row) => ({
    id: `${row.classId}:${row.subjectCode}`,
    className: row.className,
    subjectCode: row.subjectCode,
    subjectName: row.subjectName,
    taskCount: row.taskCount,
    gradedCount: row.gradedCount,
    average: row.avg,
    highest: row.highest,
    lowest: row.lowest,
  }));
  const absenRows: RekapAbsenRow[] = data.kehadiran.map((row) => ({
    id: `${row.classId}:${row.subjectCode}`,
    className: row.className,
    subjectCode: row.subjectCode,
    subjectName: row.subjectName,
    hadir: row.hadir,
    terlambat: row.terlambat,
    izin: row.izin,
    sakit: row.sakit,
    opportunities: row.opportunities,
    presencePercent: row.presencePercent,
  }));

  const classTabs: ClassTabOption[] = data.availableClasses.map((klass) => ({
    id: klass.id,
    name: klass.name,
    isCurrent: klass.id === data.currentClassId,
  }));

  const optionMap = new Map<string, { code: string; name: string }>();
  for (const row of [...data.nilai, ...data.kehadiran]) {
    if (!optionMap.has(row.subjectCode)) {
      optionMap.set(row.subjectCode, {
        code: row.subjectCode,
        name: row.subjectName,
      });
    }
  }
  const codes = [...optionMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const currentSubject = requestedSubject &&
      codes.some((subject) => subject.code === requestedSubject)
    ? requestedSubject
    : null;
  const subjectOptions: SubjectOption[] = codes.map((subject) => ({
    code: subject.code,
    name: subject.name,
    isCurrent: subject.code === currentSubject,
  }));

  const avg = recapAverage(nilaiRows);
  const tasks = nilaiRows.reduce((sum, row) => sum + row.taskCount, 0);
  const graded = nilaiRows.reduce((sum, row) => sum + row.gradedCount, 0);
  const presence = recapPresence(absenRows);
  const classCount = new Set(
    [...data.nilai, ...data.kehadiran].map((row) => row.classId),
  ).size;
  const stats: RekapReportProps["stats"] = [
    {
      label: "Rata-rata Nilai",
      value: avg == null ? "—" : formatDecimal(avg),
      toneText: "text-role-murid",
    },
    {
      label: "Tugas Dinilai",
      value: `${graded}/${tasks}`,
      toneText: "text-role-guru",
    },
    {
      label: "% Kehadiran",
      value: formatPercent(presence),
      toneText: "text-status-hadir",
    },
    {
      label: "Kelas",
      value: String(classCount),
      toneText: "text-role-admin",
    },
    {
      label: "Mapel",
      value: String(optionMap.size),
      toneText: "text-content",
    },
  ];

  return {
    stats,
    classTabs,
    subjectOptions,
    currentClass: data.currentClassId,
    currentSubject,
    nilaiRows,
    absenRows,
  };
}

async function loadRekapReport(
  accessToken: string,
  scope: "guru" | "admin",
  requestedClass: string | null,
  requestedSubject: string | null,
): Promise<{ part: RekapPropsPartial; note: string | null }> {
  try {
    const data = await getRekapReport(accessToken, scope, {
      classId: requestedClass ?? undefined,
      subjectCode: requestedSubject ?? undefined,
    });
    return { part: rekapFromApi(data, requestedSubject), note: null };
  } catch (error) {
    const empty: RekapReportApiData = {
      availableClasses: [],
      currentClassId: null,
      nilai: [],
      kehadiran: [],
    };
    const message = error instanceof Error ? error.message : "Tidak diketahui";
    return {
      part: rekapFromApi(empty, requestedSubject),
      note: `Rekap tidak dapat dimuat dari server API (${message}).`,
    };
  }
}

// ---------------------------------------------------------------------------
// Progres murid
// ---------------------------------------------------------------------------
function periodeOptionsFor(days: number): PeriodeOption[] {
  const defs: Array<{ value: string; days: number; label: string }> = [
    { value: "7", days: 7, label: "7 hari" },
    { value: "30", days: 30, label: "30 hari" },
    { value: "365", days: 365, label: "Semua" },
  ];
  return defs.map((option) => ({
    value: option.value,
    label: option.label,
    isCurrent: option.days === days,
  }));
}

type MuridView = Omit<MuridReportData, "periodeOptions">;

function muridViewFrom(data: MuridProgressReportApiData): MuridView {
  return {
    className: data.student.className,
    summary: {
      avgScore: data.overview.avgScore,
      totalTasks: data.overview.totalTasks,
      doneTasks: data.overview.doneTasks,
      gradedTasks: data.overview.gradedTasks,
      presence: presenceOf(data.presence),
    },
    mapel: data.mapel.map(progressMapelOf),
    grades: data.grades.map(gradeFromApi),
    history: data.history.map(historyFromApi),
  };
}

function emptyMuridView(note: string): MuridView {
  return {
    className: "Kelas Anda",
    note,
    summary: {
      avgScore: null,
      totalTasks: 0,
      doneTasks: 0,
      gradedTasks: 0,
      presence: { ...ZERO_PRESENCE },
    },
    mapel: [],
    grades: [],
    history: [],
  };
}

async function loadMuridData(
  accessToken: string,
  days: number,
): Promise<{ data: MuridView; note: string | null }> {
  try {
    const progress = await getMuridProgressReport(accessToken, { days });
    return { data: muridViewFrom(progress), note: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tidak diketahui";
    return {
      data: emptyMuridView(message),
      note: `Progres belajar tidak dapat dimuat dari server API (${message}).`,
    };
  }
}

// ---------------------------------------------------------------------------
// Pantauan orang tua
// ---------------------------------------------------------------------------
function childFromPantauan(item: PantauanChildApi): ChildProgress {
  return {
    id: item.id,
    name: item.name,
    className: item.className,
    avgScore: item.overview.avgScore,
    taskDone: item.overview.doneTasks,
    taskTotal: item.overview.totalTasks,
    attendance: presenceOf(item.presence),
    today: presenceOf(item.today),
    mapel: item.mapel.map(progressMapelOf),
    grades: item.grades.map(gradeFromApi),
    history: item.history.map(historyFromApi),
  };
}

async function loadOrtuChildren(
  accessToken: string,
  days = 30,
): Promise<{ children: ChildProgress[]; note: string | null }> {
  try {
    const data = await getOrtuPantauan(accessToken, { days });
    return {
      children: data.children.map(childFromPantauan),
      note: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tidak diketahui";
    return {
      children: [],
      note: `Data pantauan tidak dapat dimuat dari server API (${message}).`,
    };
  }
}

// ---------------------------------------------------------------------------
// Handler & halaman
// ---------------------------------------------------------------------------
export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");

    const role = session.user.role;
    if (
      role !== "guru" &&
      role !== "murid" &&
      role !== "orang_tua" &&
      role !== "admin"
    ) {
      return ctx.redirect("/");
    }

    const now = new Date();
    const url = new URL(ctx.req.url);
    const base = {
      role,
      userName: session.user.name,
      roleLabel: ROLE_META[role].label,
      greeting: greetingForHour(now),
      dateLabel: toDateLabel(now),
    };

    const pageData: {
      role: typeof role;
      guru?: RekapReportProps;
      admin?: RekapReportProps;
      murid?: MuridReportData;
      ortu?: OrtuReportData;
    } = { role };

    if (role === "guru" || role === "admin") {
      const scope = role === "guru" ? "guru" : "admin";
      const { part, note } = await loadRekapReport(
        session.accessToken,
        scope,
        url.searchParams.get("class"),
        url.searchParams.get("subject"),
      );
      const section: RekapReportProps = {
        ...part,
        note,
        title: role === "guru" ? "Rekap Nilai & Kehadiran" : "Rekap Sekolah",
        csvPrefix: role === "guru" ? "laporan-guru" : "laporan-admin",
      };
      if (role === "guru") pageData.guru = section;
      else pageData.admin = section;
    }

    if (role === "murid") {
      const periodeRaw = url.searchParams.get("periode");
      const days = periodeRaw === "7" ? 7 : periodeRaw === "365" ? 365 : 30;
      const { data, note } = await loadMuridData(session.accessToken, days);
      pageData.murid = {
        ...data,
        note,
        periodeOptions: periodeOptionsFor(days),
      };
    }

    if (role === "orang_tua") {
      const requestedId = url.searchParams.get("child");
      const { children, note } = await loadOrtuChildren(
        session.accessToken,
        30,
      );
      const current = requestedId && children.some((c) => c.id === requestedId)
        ? children.find((c) => c.id === requestedId)!
        : children[0] ?? null;
      pageData.ortu = {
        children,
        currentChildId: current?.id ?? null,
        currentChild: current,
        note,
      };
    }

    return page({ ...base, ...pageData });
  },
});

const SUBTITLE: Record<string, string> = {
  guru: "Rekap nilai, kehadiran, dan progres kelas yang Anda ampu.",
  murid: "Progres belajar Anda — nilai dan kehadiran dalam satu tampilan.",
  orang_tua: "Pantau kehadiran dan perkembangan belajar anak Anda.",
  admin: "Rekap nilai dan kehadiran seluruh kelas sekolah.",
};

type LaporanPageData = {
  role: "guru" | "murid" | "orang_tua" | "admin";
  userName: string;
  roleLabel: string;
  greeting: string;
  dateLabel: string;
  guru?: RekapReportProps;
  admin?: RekapReportProps;
  murid?: MuridReportData;
  ortu?: OrtuReportData;
};

export default define.page<typeof handler>(
  ({ data }: { data: LaporanPageData }) => {
    return (
      <>
        <Head>
          <title>Laporan & Progres — SMA Muhammadiyah Imogiri</title>
        </Head>

        <section class="mb-6">
          <p class="text-sm text-content-muted">{data.dateLabel}</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Laporan & Progres
          </h1>
          <p class="mt-1 text-sm text-content-muted">
            <span class="font-semibold text-primary">{data.roleLabel}</span> —
            {" "}
            {data.greeting}, {data.userName.split(" ")[0]}.{" "}
            {SUBTITLE[data.role]}
          </p>
        </section>

        {data.role === "guru" && data.guru && <RekapReport {...data.guru} />}
        {data.role === "admin" && data.admin && <RekapReport {...data.admin} />}
        {data.role === "murid" && data.murid && (
          <MuridReport data={data.murid} />
        )}
        {data.role === "orang_tua" && data.ortu && (
          <OrtuReport data={data.ortu} />
        )}
      </>
    );
  },
);
