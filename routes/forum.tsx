import { HttpError, page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import type { Role } from "@/lib/types.ts";
import { ROLE_META } from "@/lib/roles.ts";
import { Card } from "@/components/ui/Card.tsx";
import { Badge } from "@/components/ui/Badge.tsx";
import { type ForumTopicApi, getForumTopics } from "@/lib/server/backend.ts";
import { greetingForHour, timeAgoLabel, toDateLabel } from "@/lib/date.ts";

interface ForumData {
  role: Role;
  userName: string;
  roleLabel: string;
  greeting: string;
  dateLabel: string;
  items: ForumTopicApi[];
  total: number;
  replies: number;
  unread: number;
  subjectCount: number;
  currentClass: string | null;
  classTabs: Array<{ id: string; name: string; isCurrent: boolean }>;
  subjectOptions: Array<{ code: string; name: string }>;
  activeSubject: string | null;
  q: string;
  error?: string;
}

function filterItems(items: ForumTopicApi[], filters: {
  subject?: string | null;
  q: string;
}): ForumTopicApi[] {
  const q = filters.q.trim().toLowerCase();
  return items.filter((topic) => {
    if (filters.subject && topic.subjectCode !== filters.subject) return false;
    if (q) {
      const haystack = [
        topic.title,
        topic.body,
        topic.authorName,
        topic.subjectName,
        topic.className,
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
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

    try {
      const list = await getForumTopics(session.accessToken);
      const allowedIds = list.availableClasses.map((c) => c.id);
      const requested = url.searchParams.get("class");
      const currentClass = requested && allowedIds.includes(requested)
        ? requested
        : null;
      const activeSubject = url.searchParams.get("subject");
      const q = url.searchParams.get("q") ?? "";

      const base = currentClass
        ? list.topics.filter((t) => t.classId === currentClass)
        : list.topics;
      const items = filterItems(base, { subject: activeSubject, q });

      const classTabs = list.availableClasses.map((klass) => ({
        id: klass.id,
        name: klass.name,
        isCurrent: klass.id === currentClass,
      }));

      const subjectOptions = [
        ...new Map(
          base.map((t) => [
            t.subjectCode,
            { code: t.subjectCode, name: t.subjectName },
          ]),
        ).values(),
      ].sort((a, b) => a.name.localeCompare(b.name));

      return page({
        role,
        userName: session.user.name,
        roleLabel: ROLE_META[role].label,
        greeting: greetingForHour(now),
        dateLabel: toDateLabel(now),
        items,
        total: items.length,
        replies: items.reduce((sum, t) => sum + t.replies, 0),
        unread: items.filter((t) => t.replies === 0).length,
        subjectCount: subjectOptions.length,
        currentClass,
        classTabs,
        subjectOptions,
        activeSubject,
        q,
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Gagal memuat forum diskusi");
    }
  },
});

export default define.page<typeof handler>(({ data }: { data: ForumData }) => {
  function href(over: {
    q?: string;
    class?: string | null;
    subject?: string | null;
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
    const query = params.toString();
    return query ? `/forum?${query}` : "/forum";
  }

  const chip = (active: boolean) =>
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-border bg-surface text-content-muted hover:text-content";

  return (
    <>
      <Head>
        <title>Forum Diskusi — SMA Muahmmadiyah Imogiri</title>
      </Head>

      <section class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-sm text-content-muted">{data.dateLabel}</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Forum Diskusi
          </h1>
          <p class="mt-1 text-sm text-content-muted">
            <span class="font-semibold text-primary">{data.roleLabel}</span> —
            {" "}
            {data.greeting}, {data.userName.split(" ")[0]}
          </p>
        </div>
        <a
          href="/forum/buat"
          class="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Tulis Topik
        </a>
      </section>

      <section class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-sm text-content-muted">Topik</p>
          <p class="mt-1 text-3xl font-bold tabular-nums text-content">
            {data.total}
          </p>
        </div>
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-sm text-content-muted">Balasan</p>
          <p class="mt-1 text-3xl font-bold tabular-nums text-role-murid">
            {data.replies}
          </p>
        </div>
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-sm text-content-muted">Belum Dibalas</p>
          <p class="mt-1 text-3xl font-bold tabular-nums text-role-ortu">
            {data.unread}
          </p>
        </div>
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-sm text-content-muted">Mapel Aktif</p>
          <p class="mt-1 text-3xl font-bold tabular-nums text-role-guru">
            {data.subjectCount}
          </p>
        </div>
      </section>

      <Card
        title="Daftar Topik"
        description={data.error
          ? data.error
          : data.items.length > 0
          ? "Diskusi kelas terbaru dari forum"
          : "Belum ada topik"}
      >
        <form
          method="get"
          action="/forum"
          class="mb-3 flex flex-wrap items-center gap-2"
        >
          {data.currentClass && (
            <input type="hidden" name="class" value={data.currentClass} />
          )}
          {data.activeSubject && (
            <input type="hidden" name="subject" value={data.activeSubject} />
          )}
          <input
            type="text"
            name="q"
            defaultValue={data.q}
            placeholder="Cari topik, mapel, atau penulis…"
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
          {data.subjectOptions.length > 1 && (
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
          )}
        </div>

        {data.items.length === 0
          ? (
            <p class="py-10 text-center text-sm text-content-muted">
              Tidak ada topik yang cocok.
            </p>
          )
          : (
            <ul class="divide-y divide-border">
              {data.items.map((topic) => (
                <li key={topic.id} class="py-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        {topic.isHidden && (
                          <Badge tone="terlambat">Disembunyikan</Badge>
                        )}
                        <span class="inline-flex items-center rounded bg-role-guru/10 px-1.5 py-0.5 text-[10px] font-bold text-role-guru">
                          {topic.subjectCode}
                        </span>
                        <a
                          href={`/forum/${topic.id}`}
                          class="font-medium text-content hover:text-primary"
                        >
                          {topic.title}
                        </a>
                      </div>
                      <p class="mt-1 text-sm text-content-muted">
                        {topic.body}
                      </p>
                      <p class="mt-1 text-xs text-content-muted">
                        {topic.authorName}
                        {topic.authorRole === "guru" && " (Guru)"} •{" "}
                        {topic.className} • {topic.subjectName} •{" "}
                        {timeAgoLabel(topic.createdAt)}
                      </p>
                    </div>
                    <div class="shrink-0 text-right">
                      <span class="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-content">
                        {topic.replies} balasan
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </Card>
    </>
  );
});
