import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import type { Role } from "@/lib/types.ts";
import { ROLE_META } from "@/lib/roles.ts";
import { Card } from "@/components/ui/Card.tsx";
import { Badge } from "@/components/ui/Badge.tsx";
import {
  getAttendanceOptions,
  getMaterialsList,
  type MaterialsListItem,
} from "@/lib/server/backend.ts";
import { greetingForHour, toDateLabel } from "@/lib/date.ts";
import MaterialDownload from "@/islands/MaterialDownload.tsx";
import UnduhanList from "@/islands/UnduhanList.tsx";
import MaterialUpload from "@/islands/MaterialUpload.tsx";

type MaterialType = "pdf" | "video" | "dokumen" | "catatan";

interface MateriData {
  role: Role;
  userName: string;
  roleLabel: string;
  greeting: string;
  dateLabel: string;
  items: ViewMaterial[];
  total: number;
  classTabs: Array<{ id: string; name: string; isCurrent: boolean }>;
  currentClass: string | null;
  activeSubject: string | null;
  activeType: MaterialType | null;
  q: string;
  subjectOptions: Array<{ code: string; name: string }>;
  uploadClasses: Array<{ id: string; name: string }>;
  uploadSubjects: Array<{ id: string; name: string }>;
  error: string | null;
}

interface ViewMaterial {
  id: string;
  className: string;
  classId: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  title: string;
  description: string;
  content: string;
  fileUrl: string;
  type: MaterialType;
  uploadedLabel: string;
}

const TYPE_META: Record<MaterialType, { label: string; chip: string }> = {
  pdf: { label: "PDF", chip: "bg-role-guru/10 text-role-guru" },
  video: { label: "VIDEO", chip: "bg-role-murid/10 text-role-murid" },
  dokumen: { label: "DOKUMEN", chip: "bg-role-ortu/10 text-role-ortu" },
  catatan: { label: "CATATAN", chip: "bg-primary/10 text-primary" },
};

const ALL_TYPES: MaterialType[] = ["pdf", "video", "dokumen", "catatan"];

function uploadedLabelOf(iso: string): string {
  const diff = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 86400000),
  );
  if (diff === 0) return "hari ini";
  if (diff === 1) return "kemarin";
  return `${diff} hari lalu`;
}

function adapt(items: MaterialsListItem[]): ViewMaterial[] {
  return items.map((item) => ({
    id: item.id,
    className: item.className,
    classId: item.classId,
    subjectCode: item.subjectCode,
    subjectName: item.subjectName,
    teacherName: item.teacherName,
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    fileUrl: item.fileUrl,
    type: item.type,
    uploadedLabel: uploadedLabelOf(item.createdAt),
  }));
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
    const activeTypeRaw = url.searchParams.get("type");
    const activeType = activeTypeRaw === "pdf" ||
        activeTypeRaw === "video" ||
        activeTypeRaw === "dokumen"
      ? activeTypeRaw
      : null;
    const q = url.searchParams.get("q") ?? "";
    const requestedClass = url.searchParams.get("class");

    let all: ViewMaterial[] = [];
    let availableClasses: Array<{ id: string; name: string }> = [];
    let currentClass: string | null = null;
    let error: string | null = null;

    const uploadClasses: Array<{ id: string; name: string }> = [];
    const uploadSubjects: Array<{ id: string; name: string }> = [];

    if (role === "guru") {
      try {
        const options = await getAttendanceOptions(session.accessToken);
        const classMap = new Map<string, { id: string; name: string }>();
        const subjectMap = new Map<string, { id: string; name: string }>();
        for (const option of options) {
          classMap.set(option.classId, {
            id: option.classId,
            name: option.className,
          });
          subjectMap.set(option.subjectId, {
            id: option.subjectId,
            name: option.subjectName,
          });
        }
        uploadClasses.push(...classMap.values());
        uploadSubjects.push(...subjectMap.values());
      } catch {
        // diabaikan — dropdown upload kosong bila API tidak tersedia
      }
    }

    try {
      const data = await getMaterialsList(
        session.accessToken,
        requestedClass ?? undefined,
      );
      availableClasses = data.availableClasses;
      currentClass = data.currentClassId;
      all = adapt(data.materials);
    } catch (err) {
      error = err instanceof Error ? err.message : "Gagal memuat materi";
    }

    const requested = availableClasses.some((c) => c.id === requestedClass)
      ? requestedClass
      : null;

    const base = requested ? all.filter((m) => m.classId === requested) : all;

    const filtered = base.filter((item) => {
      if (activeSubject && item.subjectCode !== activeSubject) return false;
      if (activeType && item.type !== activeType) return false;
      if (q.trim()) {
        const haystack = [
          item.title,
          item.description,
          item.subjectName,
          item.teacherName,
          item.className,
        ].join(" ").toLowerCase();
        if (!haystack.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });

    const classTabs = availableClasses.map((c) => ({
      id: c.id,
      name: c.name,
      isCurrent: c.id === currentClass,
    }));

    const subjectOptions = [
      ...new Map(
        base.map((
          m,
        ) => [m.subjectCode, { code: m.subjectCode, name: m.subjectName }]),
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
      classTabs,
      currentClass,
      activeSubject,
      activeType,
      q,
      subjectOptions,
      uploadClasses,
      uploadSubjects,
      error,
    });
  },
});

function typeCount(items: ViewMaterial[], type: MaterialType): number {
  return items.filter((item) => item.type === type).length;
}

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
    return query ? `/materi?${query}` : "/materi";
  }

  const chip = (active: boolean) =>
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-border bg-surface text-content-muted hover:text-content";

  return (
    <>
      <Head>
        <title>Materi Pelajaran — SMA Muhammadiyah Imogiri</title>
      </Head>

      <section class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-sm text-content-muted">{data.dateLabel}</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Materi Pelajaran
          </h1>
          <p class="mt-1 text-sm text-content-muted">
            <span class="font-semibold text-primary">{data.roleLabel}</span> —
            {" "}
            {data.greeting}, {data.userName.split(" ")[0]}
          </p>
        </div>
        {isGuru && (
          <a
            href="/materi/tulis"
            class="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Tulis Materi
          </a>
        )}
      </section>

      {isGuru && (
        <Card
          class="mb-6 border-dashed bg-surface-subtle"
          title="Unggah Materi"
          description="Upload langsung ke penyimpanan (presigned URL); metadata tersimpan otomatis"
        >
          <MaterialUpload
            classOptions={data.uploadClasses}
            subjectOptions={data.uploadSubjects}
          />
        </Card>
      )}

      <Card
        title={isGuru ? "Daftar Materi Saya" : "Pustaka Materi"}
        description="Data dari API — gunakan filter untuk mempersempit"
        action={<Badge tone="neutral">{data.total} materi</Badge>}
      >
        {data.error && (
          <div
            role="alert"
            class="mb-3 rounded-md border border-status-sakit/30 bg-status-sakit/10 px-3 py-2 text-sm text-status-sakit"
          >
            {data.error}
          </div>
        )}

        <form
          method="get"
          action="/materi"
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
            placeholder="Cari materi, mapel, atau guru…"
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
          {isGuru && data.classTabs.length > 1 && (
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
            {ALL_TYPES.map((type) => (
              <a
                key={type}
                href={href({ type: type === data.activeType ? null : type })}
                class={`rounded-full border px-2.5 py-1 font-medium ${
                  chip(type === data.activeType)
                }`}
              >
                {TYPE_META[type].label}
              </a>
            ))}
          </div>
        </div>

        {data.items.length === 0
          ? (
            <p class="py-10 text-center text-sm text-content-muted">
              {data.error
                ? "Materi tidak dapat dimuat."
                : "Belum ada materi yang cocok."}
            </p>
          )
          : isGuru
          ? (
            <div class="overflow-x-auto">
              <table class="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr class="text-left text-xs uppercase tracking-wide text-content-muted">
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Materi
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
                      Diunggah
                    </th>
                    <th class="border-b border-border px-3 py-2 font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => {
                    const meta = TYPE_META[item.type];
                    return (
                      <tr
                        key={item.id}
                        class="border-b border-border align-top"
                      >
                        <td class="px-3 py-2">
                          <p class="font-medium text-content">{item.title}</p>
                          {item.description && (
                            <p class="mt-0.5 text-xs text-content-muted">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td class="whitespace-nowrap px-3 py-2 text-xs text-content-muted">
                          {item.className}
                        </td>
                        <td class="whitespace-nowrap px-3 py-2 text-xs text-content">
                          {item.subjectName}
                        </td>
                        <td class="px-3 py-2">
                          <span
                            class={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${meta.chip}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td class="whitespace-nowrap px-3 py-2 text-xs text-content-muted">
                          {item.uploadedLabel}
                        </td>
                        <td class="px-3 py-2">
                          <div class="flex gap-1.5">
                            <a
                              href={item.type === "catatan"
                                ? `/materi/baca/${item.id}`
                                : item.fileUrl}
                              {...(item.type === "catatan"
                                ? {}
                                : { target: "_blank", rel: "noreferrer" })}
                              class="rounded-md border border-border-strong bg-surface px-2 py-1 text-[11px] font-semibold text-content-muted hover:text-content"
                            >
                              {item.type === "catatan" ? "Baca" : "Buka"}
                            </a>
                            <button
                              type="button"
                              aria-disabled="true"
                              title="Kerangka"
                              class="rounded-md border border-border-strong bg-surface px-2 py-1 text-[11px] font-semibold text-content-muted"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              aria-disabled="true"
                              title="Kerangka"
                              class="rounded-md border border-status-sakit/40 px-2 py-1 text-[11px] font-semibold text-status-sakit"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
          : (
            <ul class="grid gap-3 sm:grid-cols-2">
              {data.items.map((item) => {
                const meta = TYPE_META[item.type];
                return (
                  <li
                    key={item.id}
                    class="rounded-xl border border-border bg-surface p-4"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="font-semibold text-content">{item.title}</p>
                        {item.description && (
                          <p class="mt-1 text-sm text-content-muted">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span
                        class={`inline-flex shrink-0 items-center rounded-md px-2 py-1 text-[10px] font-bold ${meta.chip}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p class="mt-3 text-xs text-content-muted">
                      {item.className} • {item.subjectName} • {item.teacherName}
                    </p>
                    <p class="mt-0.5 text-xs text-content-muted">
                      diunggah {item.uploadedLabel}
                    </p>
                    <div class="mt-3 flex gap-2">
                      <a
                        href={item.type === "catatan"
                          ? `/materi/baca/${item.id}`
                          : item.fileUrl}
                        {...(item.type === "catatan"
                          ? {}
                          : { target: "_blank", rel: "noreferrer" })}
                        class="rounded-md bg-primary/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary"
                      >
                        {item.type === "catatan" ? "Baca" : "Buka"}
                      </a>
                      {item.type !== "catatan" && (
                        <MaterialDownload id={item.id} title={item.title} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

        {data.items.length > 0 && (
          <div class="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-content-muted">
            {ALL_TYPES.map((type) => (
              <span key={type}>
                {TYPE_META[type].label}: {typeCount(data.items, type)}
              </span>
            ))}
          </div>
        )}
      </Card>

      {!isGuru && (
        <div class="mt-6">
          <Card
            title="Daftar Unduhan"
            description="Materi yang pernah Anda unduh (tersimpan di perangkat ini)"
          >
            <UnduhanList
              items={data.items.map((item) => ({
                id: item.id,
                title: item.title,
                subjectName: item.subjectName,
              }))}
            />
          </Card>
        </div>
      )}
    </>
  );
});
