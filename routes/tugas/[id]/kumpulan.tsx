import { HttpError, page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import {
  getAssignmentsList,
  getSubmissionsList,
  type SubmissionApiItem,
} from "@/lib/server/backend.ts";
import { Badge } from "@/components/ui/Badge.tsx";
import { Card } from "@/components/ui/Card.tsx";

interface KumpulanData {
  title: string;
  className: string;
  subjectName: string;
  rows: SubmissionApiItem[];
  graded: number;
}

function answerSummary(row: SubmissionApiItem): string {
  const answer = row.answer as Record<string, unknown> | null;
  if (!answer) return "-";
  if (Array.isArray(answer.answers)) {
    return `${(answer.answers as unknown[]).length} soal dijawab`;
  }
  if (typeof answer.text === "string") {
    const text = answer.text as string;
    return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  }
  if (Array.isArray(answer.answers)) {
    const joined = (answer.answers as unknown[]).filter((x): x is string =>
      typeof x === "string"
    ).join(" | ");
    return joined.length > 60 ? `${joined.slice(0, 60)}…` : joined;
  }
  if (typeof answer.fileName === "string") return answer.fileName as string;
  return "Jawaban";
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${
    pad(d.getMinutes())
  }`;
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "guru") return ctx.redirect("/tugas");

    try {
      const list = await getAssignmentsList(session.accessToken);
      const task = list.assignments.find((a) => a.id === ctx.params.id);
      if (!task) throw new HttpError(404, "Tugas tidak ditemukan");

      const rows = await getSubmissionsList(session.accessToken, task.id);
      const graded = rows.filter((row) => row.score != null).length;

      return page({
        title: task.title,
        className: task.className,
        subjectName: task.subjectName,
        rows,
        graded,
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(404, "Tugas tidak ditemukan");
    }
  },
});

export default define.page<typeof handler>(
  ({ data }: { data: KumpulanData }) => {
    return (
      <>
        <Head>
          <title>Pengumpul — {data.title}</title>
        </Head>

        <a
          href="/tugas"
          class="text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Kembali ke Daftar Tugas
        </a>

        <header class="mt-4">
          <p class="text-sm text-content-muted">
            {data.className} • {data.subjectName}
          </p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Daftar Pengumpul — {data.title}
          </h1>
        </header>

        <section class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div class="rounded-xl border border-border bg-surface p-4">
            <p class="text-sm text-content-muted">Terkumpul</p>
            <p class="mt-1 text-3xl font-bold tabular-nums text-status-hadir">
              {data.rows.length}
            </p>
          </div>
          <div class="rounded-xl border border-border bg-surface p-4">
            <p class="text-sm text-content-muted">Sudah Dinilai</p>
            <p class="mt-1 text-3xl font-bold tabular-nums text-role-ortu">
              {data.graded}
            </p>
          </div>
          <div class="rounded-xl border border-border bg-surface p-4">
            <p class="text-sm text-content-muted">Belum Dinilai</p>
            <p class="mt-1 text-3xl font-bold tabular-nums text-content-muted">
              {data.rows.length - data.graded}
            </p>
          </div>
        </section>

        <div class="mt-6">
          <Card title="Pengumpulan per Murid" description="Data dari API">
            {data.rows.length === 0
              ? (
                <p class="py-10 text-center text-sm text-content-muted">
                  Belum ada murid yang mengumpulkan tugas ini.
                </p>
              )
              : (
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[720px] border-collapse text-sm">
                    <thead>
                      <tr class="text-left text-xs uppercase tracking-wide text-content-muted">
                        <th class="border-b border-border px-3 py-2 font-semibold">
                          Murid
                        </th>
                        <th class="border-b border-border px-3 py-2 font-semibold">
                          Status
                        </th>
                        <th class="border-b border-border px-3 py-2 font-semibold">
                          Jawaban
                        </th>
                        <th class="border-b border-border px-3 py-2 font-semibold">
                          Waktu
                        </th>
                        <th class="border-b border-border px-3 py-2 font-semibold">
                          Nilai
                        </th>
                        <th class="border-b border-border px-3 py-2 font-semibold">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row) => (
                        <tr
                          key={row.id}
                          class="border-b border-border align-middle"
                        >
                          <td class="px-3 py-2">
                            <p class="font-medium text-content">
                              {row.studentName}
                            </p>
                          </td>
                          <td class="px-3 py-2">
                            <Badge tone="hadir">Terkumpul</Badge>
                          </td>
                          <td class="px-3 py-2 text-xs text-content">
                            {answerSummary(row)}
                          </td>
                          <td class="whitespace-nowrap px-3 py-2 text-xs text-content-muted">
                            {timeLabel(row.submittedAt)}
                          </td>
                          <td class="px-3 py-2 text-xs font-semibold text-content">
                            {row.score ?? "-"}
                          </td>
                          <td class="px-3 py-2">
                            <a
                              href={`/tugas/${row.assignmentId}/nilai/${row.studentId}`}
                              class="rounded-md border border-border-strong bg-surface px-2.5 py-1 text-[11px] font-semibold text-content-muted hover:border-primary hover:text-primary"
                            >
                              {row.score == null ? "Nilai" : "Lihat"}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </Card>
        </div>
      </>
    );
  },
);
