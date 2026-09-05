import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import type { Role } from "@/lib/types.ts";
import { ROLE_META } from "@/lib/roles.ts";
import { Card } from "@/components/ui/Card.tsx";
import { Badge } from "@/components/ui/Badge.tsx";
import {
  type AssignmentApiItem,
  getAssignmentsList,
  getMyGrades,
  type MyGradesResponse,
  type TaskKind,
} from "@/lib/server/backend.ts";
import { greetingForHour, toDateLabel } from "@/lib/date.ts";

interface TugasData {
  role: Role;
  userName: string;
  roleLabel: string;
  greeting: string;
  dateLabel: string;
  items: TaskView[];
  total: number;
  currentClass: string | null;
  classTabs: Array<{ id: string; name: string; isCurrent: boolean }>;
  subjectOptions: Array<{ code: string; name: string }>;
  activeSubject: string | null;
  activeType: TaskKind | null;
  q: string;
  myGrades: MyGradesResponse | null;
  error: string | null;
}

interface TaskView {
  id: string;
  className: string;
  classId: string;
  subjectCode: string;
  subjectName: string;
  title: string;
  instruction: string;
  type: TaskKind;
  questions: AssignmentApiItem["questions"];
  daysLeft: number;
  status: "belum" | "dikumpulkan" | "terlambat";
  score: number | null;
}

const TYPE_LABEL: Record<TaskKind, string> = {
  pilihan_ganda: "Pilihan Ganda",
  esai: "Esai",
  upload: "Unggah File",
  campuran: "Campuran (PG + Esai)",
};

const TYPE_CHIP: Record<TaskKind, string> = {
  pilihan_ganda: "bg-role-murid/10 text-role-murid",
  esai: "bg-role-guru/10 text-role-guru",
  upload: "bg-role-ortu/10 text-role-ortu",
  campuran: "bg-role-admin/10 text-role-admin",
};

const STATUS_LABEL: Record<TaskView["status"], string> = {
  belum: "Belum",
  dikumpulkan: "Dikumpulkan",
  terlambat: "Terlambat",
};

function daysLeftOf(iso: string, now: Date): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86400000);
}

function dueLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)} hari terlambat`;
  if (daysLeft === 0) return "Tenggat hari ini";
  if (daysLeft === 1) return "Besok";
  return `${daysLeft} hari lagi`;
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "guru" && session.user.role !== "murid") {
      return ctx.redirect("/");
    }
    const now = new Date();
    const url = new URL(ctx.req.url);
    const role = session.user.role;

    const activeSubject = url.searchParams.get("subject");
    const typeRaw = url.searchParams.get("type");
    const activeType = typeRaw === "pilihan_ganda" ||
        typeRaw === "esai" ||
        typeRaw === "upload"
      ? typeRaw
      : null;
    const q = url.searchParams.get("q") ?? "";
    const requestedClass = url.searchParams.get("class");

    let available: Array<{ id: string; name: string }> = [];
    let assignments: AssignmentApiItem[] = [];
    let myGrades: MyGradesResponse | null = null;
    let error: string | null = null;

    try {
      const list = await getAssignmentsList(
        session.accessToken,
        requestedClass ?? undefined,
      );
      available = list.availableClasses;
      assignments = list.assignments;
      if (role === "murid") {
        myGrades = await getMyGrades(session.accessToken);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Gagal memuat tugas";
    }

    const myByAssignment = new Map<
      string,
      MyGradesResponse["results"][number]
    >();
    for (const result of myGrades?.results ?? []) {
      myByAssignment.set(result.assignmentId, result);
    }

    const items: TaskView[] = assignments.map((assignment) => {
      const mine = myByAssignment.get(assignment.id);
      const dl = daysLeftOf(assignment.deadline, now);
      let status: TaskView["status"];
      if (mine) {
        status = "dikumpulkan";
      } else if (dl < 0) {
        status = "terlambat";
      } else {
        status = "belum";
      }
      return {
        id: assignment.id,
        className: assignment.className,
        classId: assignment.classId,
        subjectCode: assignment.subjectCode,
        subjectName: assignment.subjectName,
        title: assignment.title,
        instruction: assignment.instruction,
        type: assignment.type,
        questions: assignment.questions,
        daysLeft: dl,
        status,
        score: mine?.score ?? null,
      };
    });

    const requested = available.some((c) => c.id === requestedClass)
      ? requestedClass
      : null;
    const base = requested
      ? items.filter((t) => t.classId === requested)
      : items;
    const filtered = base.filter((task) => {
      if (activeSubject && task.subjectCode !== activeSubject) return false;
      if (activeType && task.type !== activeType) return false;
      if (q.trim()) {
        const haystack = [
          task.title,
          task.instruction,
          task.subjectName,
          task.className,
        ].join(" ").toLowerCase();
        if (!haystack.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });

    const classTabs = available.map((c) => ({
      id: c.id,
      name: c.name,
      isCurrent: c.id === (requested ?? ""),
    }));

    const subjectOptions = [
      ...new Map(
        base.map((
          t,
        ) => [t.subjectCode, { code: t.subjectCode, name: t.subjectName }]),
      ).values(),
    ].sort((a, b) => a.name.localeCompare(b.name));

    return page({
      role,
      userName: session.user.name,
      roleLabel: ROLE_META[role].label,
      greeting: greetingForHour(now),
      dateLabel: toDateLabel(now),
      items: filtered,
      total: filtered.length,
      currentClass: requested,
      classTabs,
      subjectOptions,
      activeSubject,
      activeType,
      q,
      myGrades,
      error,
    });
  },
});

export default define.page<typeof handler>(({ data }) => {
  const isGuru = data.role === "guru";

  function href(over: {
    q?: string;
    class?: string | null;
    subject?: string | null;
    type?: string | null;
  }): string {
    const params = new URLSearchParams();
    const q = over.q ?? data.q;
    if (q) params.set("q", q);
    const klass = over.class !== undefined ? over.class : data.currentClass;
    if (klass) params.set("class", klass);
    const subject = over.subject !== undefined
      ? over.subject
      : data.activeSubject;
    if (subject) params.set("subject", subject);
    const type = over.type !== undefined ? over.type : data.activeType;
    if (type) params.set("type", type);
    const query = params.toString();
    return query ? `/tugas?${query}` : "/tugas";
  }

  const chip = (active: boolean) =>
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-border bg-surface text-content-muted hover:text-content";

  const kelasCount = new Set(data.items.map((t) => t.classId)).size;
  const mapelCount = new Set(data.items.map((t) => t.subjectCode)).size;

  return (
    <>
      <Head>
        <title>Daftar Tugas — SMA Muhammadiyah Imogiri</title>
      </Head>

      <section class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-sm text-content-muted">{data.dateLabel}</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Daftar Tugas
          </h1>
          <p class="mt-1 text-sm text-content-muted">
            <span class="font-semibold text-primary">{data.roleLabel}</span> —
            {" "}
            {data.greeting}, {data.userName.split(" ")[0]}
          </p>
        </div>
        <div class="flex items-center gap-2">
          {!isGuru && (
            <a
              href="/tugas/nilai"
              class="rounded-md border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-content-muted transition-colors hover:text-primary"
            >
              Nilai Saya
            </a>
          )}
          {isGuru && (
            <a
              href="/tugas/buat"
              class="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Buat Tugas
            </a>
          )}
        </div>
      </section>

      {data.error && (
        <div
          role="alert"
          class="mb-6 rounded-md border border-status-sakit/30 bg-status-sakit/10 px-3 py-2 text-sm text-status-sakit"
        >
          {data.error}
        </div>
      )}

      <section class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-sm text-content-muted">
            {isGuru ? "Total Tugas" : "Tugas Saya"}
          </p>
          <p class="mt-1 text-3xl font-bold tabular-nums text-content">
            {data.total}
          </p>
        </div>
        {isGuru
          ? (
            <>
              <div class="rounded-xl border border-border bg-surface p-4">
                <p class="text-sm text-content-muted">Kelas</p>
                <p class="mt-1 text-3xl font-bold tabular-nums text-role-guru">
                  {kelasCount}
                </p>
              </div>
              <div class="rounded-xl border border-border bg-surface p-4">
                <p class="text-sm text-content-muted">Mapel</p>
                <p class="mt-1 text-3xl font-bold tabular-nums text-role-murid">
                  {mapelCount}
                </p>
              </div>
            </>
          )
          : (
            <>
              <div class="rounded-xl border border-border bg-surface p-4">
                <p class="text-sm text-content-muted">Dikumpulkan</p>
                <p class="mt-1 text-3xl font-bold tabular-nums text-status-hadir">
                  {data.items.filter((t) => t.status === "dikumpulkan").length}
                </p>
              </div>
              <div class="rounded-xl border border-border bg-surface p-4">
                <p class="text-sm text-content-muted">Terlambat</p>
                <p class="mt-1 text-3xl font-bold tabular-nums text-status-sakit">
                  {data.items.filter((t) => t.status === "terlambat").length}
                </p>
              </div>
            </>
          )}
      </section>

      <Card
        title={isGuru ? "Tugas Kelas" : "Tugas Saya"}
        description="Data dari API — gunakan filter untuk mempersempit"
        action={<Badge tone="neutral">{data.total} tugas</Badge>}
      >
        <form
          method="get"
          action="/tugas"
          class="mb-3 flex flex-wrap items-center gap-2"
        >
          {data.currentClass && (
            <input type="hidden" name="class" value={data.currentClass} />
          )}
          {data.activeSubject && (
            <input type="hidden" name="subject" value={data.activeSubject} />
          )}
          {data.activeType && (
            <input type="hidden" name="type" value={data.activeType} />
          )}
          <input
            type="text"
            name="q"
            defaultValue={data.q}
            placeholder="Cari tugas, mapel, atau guru…"
            class="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:w-72"
          />
          <button
            type="submit"
            class="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-semibold text-content transition-colors hover:bg-surface-muted"
          >
            Cari
          </button>
          {data.q && (
            <a
              href={href({ q: "" })}
              class="text-xs font-semibold text-primary hover:text-primary-hover"
            >
              Reset pencarian
            </a>
          )}
        </form>

        <div class="mb-4 space-y-2 text-xs">
          {data.classTabs.length > 1 && (
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold uppercase tracking-wide text-content-muted">
                Kelas
              </span>
              <a
                href={href({ class: null })}
                class={`rounded-full border px-2.5 py-1 font-medium ${
                  chip(!data.currentClass)
                }`}
              >
                Semua
              </a>
              {data.classTabs.map((klass) => (
                <a
                  key={klass.id}
                  href={href({ class: klass.isCurrent ? null : klass.id })}
                  class={`rounded-full border px-2.5 py-1 font-medium ${
                    chip(klass.isCurrent)
                  }`}
                >
                  {klass.name}
                </a>
              ))}
            </div>
          )}
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold uppercase tracking-wide text-content-muted">
              Mapel
            </span>
            <a
              href={href({ subject: null })}
              class={`rounded-full border px-2.5 py-1 font-medium ${
                chip(!data.activeSubject)
              }`}
            >
              Semua
            </a>
            {data.subjectOptions.map((subject) => (
              <a
                key={subject.code}
                href={href({
                  subject: subject.code === data.activeSubject
                    ? null
                    : subject.code,
                })}
                class={`rounded-full border px-2.5 py-1 font-medium ${
                  chip(subject.code === data.activeSubject)
                }`}
              >
                {subject.name}
              </a>
            ))}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold uppercase tracking-wide text-content-muted">
              Jenis
            </span>
            <a
              href={href({ type: null })}
              class={`rounded-full border px-2.5 py-1 font-medium ${
                chip(!data.activeType)
              }`}
            >
              Semua
            </a>
            {(Object.keys(TYPE_LABEL) as TaskKind[]).map((type) => (
              <a
                key={type}
                href={href({ type: type === data.activeType ? null : type })}
                class={`rounded-full border px-2.5 py-1 font-medium ${
                  chip(type === data.activeType)
                }`}
              >
                {TYPE_LABEL[type]}
              </a>
            ))}
          </div>
        </div>

        {data.items.length === 0
          ? (
            <p class="py-10 text-center text-sm text-content-muted">
              {data.error
                ? "Tugas tidak dapat dimuat."
                : "Tidak ada tugas yang cocok."}
            </p>
          )
          : isGuru
          ? (
            <div class="overflow-x-auto">
              <table class="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  <tr class="text-left text-xs uppercase tracking-wide text-content-muted">
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Tugas
                    </th>
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Kelas
                    </th>
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Mapel
                    </th>
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Jenis
                    </th>
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Tenggat
                    </th>
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((task) => (
                    <tr key={task.id} class="border-b border-border align-top">
                      <td class="px-3 py-2">
                        <p class="font-medium text-content">{task.title}</p>
                        <p class="mt-0.5 text-xs text-content-muted">
                          {task.instruction}
                        </p>
                      </td>
                      <td class="whitespace-nowrap px-3 py-2 text-xs text-content-muted">
                        {task.className}
                      </td>
                      <td class="whitespace-nowrap px-3 py-2 text-xs text-content">
                        {task.subjectName}
                      </td>
                      <td class="px-3 py-2">
                        <span
                          class={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            TYPE_CHIP[task.type]
                          }`}
                        >
                          {TYPE_LABEL[task.type]}
                        </span>
                      </td>
                      <td
                        class={`whitespace-nowrap px-3 py-2 text-xs ${
                          task.daysLeft < 0
                            ? "font-semibold text-status-sakit"
                            : "text-content-muted"
                        }`}
                      >
                        {dueLabel(task.daysLeft)}
                      </td>
                      <td class="px-3 py-2">
                        <a
                          href={`/tugas/${task.id}/kumpulan`}
                          class="rounded-md border border-border-strong bg-surface px-2 py-1 text-[11px] font-semibold text-content-muted hover:border-primary hover:text-primary"
                        >
                          Nilai
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
          : (
            <ul class="divide-y divide-border">
              {data.items.map((task) => (
                <li
                  key={task.id}
                  class="flex items-center justify-between gap-3 py-3"
                >
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="font-medium text-content">{task.title}</p>
                      <span
                        class={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          TYPE_CHIP[task.type]
                        }`}
                      >
                        {TYPE_LABEL[task.type]}
                      </span>
                    </div>
                    <p class="mt-0.5 text-xs text-content-muted">
                      {task.subjectName} • {task.className}
                    </p>
                    <p
                      class={`mt-1 text-xs ${
                        task.daysLeft < 0
                          ? "font-semibold text-status-sakit"
                          : "text-content-muted"
                      }`}
                    >
                      {dueLabel(task.daysLeft)}
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <Badge
                      tone={task.status === "dikumpulkan"
                        ? "hadir"
                        : task.status === "terlambat"
                        ? "terlambat"
                        : "neutral"}
                    >
                      {STATUS_LABEL[task.status]}
                    </Badge>
                    {task.score != null && (
                      <span class="inline-flex items-center rounded-full bg-role-ortu/10 px-2 py-0.5 text-xs font-semibold text-role-ortu">
                        Nilai {task.score}
                      </span>
                    )}
                    <a
                      href={`/tugas/${task.id}`}
                      class={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold ${
                        task.status === "dikumpulkan"
                          ? "bg-surface-muted text-content-muted"
                          : "bg-primary text-white hover:bg-primary-hover"
                      }`}
                    >
                      {task.status === "dikumpulkan" ? "Lihat" : "Kerjakan"}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </Card>
    </>
  );
});
