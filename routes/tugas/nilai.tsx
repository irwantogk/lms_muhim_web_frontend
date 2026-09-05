import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getMyGrades, type TaskKind } from "@/lib/server/backend.ts";
import { Badge } from "@/components/ui/Badge.tsx";
import { Card } from "@/components/ui/Card.tsx";

interface NilaiSayaData {
  userName: string;
  summary: { total: number; graded: number; avg: number | null };
  rows: Array<{
    assignmentId: string;
    title: string;
    className: string;
    subjectName: string;
    type: TaskKind;
    deadline: string;
    submittedAt: string;
    score: number | null;
    feedback: string | null;
  }>;
  error: string | null;
}

const TYPE_LABEL: Record<TaskKind, string> = {
  pilihan_ganda: "Pilihan Ganda",
  esai: "Esai",
  upload: "Unggah File",
  campuran: "Campuran (PG + Esai)",
};

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "murid") return ctx.redirect("/tugas");

    let summary = { total: 0, graded: 0, avg: null as number | null };
    let rows: NilaiSayaData["rows"] = [];
    let error: string | null = null;

    try {
      const data = await getMyGrades(session.accessToken);
      summary = data.summary;
      rows = data.results.map((r) => ({
        assignmentId: r.assignmentId,
        title: r.title,
        className: r.className,
        subjectName: r.subjectName,
        type: r.type,
        deadline: r.deadline,
        submittedAt: r.submittedAt,
        score: r.score,
        feedback: r.feedback,
      }));
    } catch (err) {
      error = err instanceof Error ? err.message : "Gagal memuat nilai";
    }

    return page({ userName: session.user.name, summary, rows, error });
  },
});

export default define.page<typeof handler>(
  ({ data }: { data: NilaiSayaData }) => {
    return (
      <>
        <Head>
          <title>Nilai Saya — SMA Muhammadiyah Imogiri</title>
        </Head>

        <section class="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm text-content-muted">{data.userName}</p>
            <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
              Nilai Saya
            </h1>
          </div>
          <a
            href="/tugas"
            class="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-content-muted transition-colors hover:text-content"
          >
            Kembali ke Tugas
          </a>
        </section>

        {data.error && (
          <div
            role="alert"
            class="mb-6 rounded-md border border-status-sakit/30 bg-status-sakit/10 px-3 py-2 text-sm text-status-sakit"
          >
            {data.error}
          </div>
        )}

        <section class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div class="rounded-xl border border-border bg-surface p-4">
            <p class="text-sm text-content-muted">Tugas Dikumpul</p>
            <p class="mt-1 text-3xl font-bold tabular-nums text-content">
              {data.summary.total}
            </p>
          </div>
          <div class="rounded-xl border border-border bg-surface p-4">
            <p class="text-sm text-content-muted">Sudah Dinilai</p>
            <p class="mt-1 text-3xl font-bold tabular-nums text-role-ortu">
              {data.summary.graded}
            </p>
          </div>
          <div class="rounded-xl border border-border bg-surface p-4">
            <p class="text-sm text-content-muted">Rata-rata</p>
            <p class="mt-1 text-3xl font-bold tabular-nums text-status-hadir">
              {data.summary.avg ?? "-"}
            </p>
          </div>
        </section>

        <div class="mt-6">
          <Card title="Hasil Tugas" description="Dari API">
            {data.rows.length === 0
              ? (
                <p class="py-10 text-center text-sm text-content-muted">
                  Belum ada tugas yang kamu kumpulkan.
                </p>
              )
              : (
                <ul class="divide-y divide-border">
                  {data.rows.map((row) => (
                    <li
                      key={row.assignmentId}
                      class="flex items-center justify-between gap-3 py-3"
                    >
                      <div class="min-w-0">
                        <p class="font-medium text-content">{row.title}</p>
                        <p class="text-xs text-content-muted">
                          {row.subjectName} • {row.className} •{" "}
                          {TYPE_LABEL[row.type]}
                        </p>
                      </div>
                      <div class="shrink-0 text-right">
                        {row.score == null
                          ? <Badge tone="neutral">Menunggu dinilai</Badge>
                          : (
                            <span class="inline-flex items-center rounded-full bg-role-ortu/10 px-2.5 py-1 text-sm font-bold text-role-ortu">
                              {row.score}
                            </span>
                          )}
                        {row.feedback && (
                          <p class="mt-1 max-w-56 text-xs italic text-content-muted">
                            “{row.feedback}”
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </Card>
        </div>
      </>
    );
  },
);
