import { HttpError, page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import {
  type AssignmentApiItem,
  getAssignmentsList,
  getMyGrades,
  type TaskKind,
} from "@/lib/server/backend.ts";
import { Badge } from "@/components/ui/Badge.tsx";
import { Card } from "@/components/ui/Card.tsx";
import AssignmentAnswer from "@/islands/AssignmentAnswer.tsx";

const TYPE_LABEL: Record<TaskKind, string> = {
  pilihan_ganda: "Pilihan Ganda",
  esai: "Esai",
  upload: "Unggah File",
  campuran: "Campuran (PG + Esai)",
};

interface DetailData {
  assignment: AssignmentApiItem;
  dueLabel: string;
  userName: string;
  submitted: boolean;
  score: number | null;
  feedback: string | null;
}

function dueLabelOf(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)} hari terlambat`;
  if (days === 0) return "Tenggat hari ini";
  if (days === 1) return "Besok";
  return `${days} hari lagi`;
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "murid") return ctx.redirect("/tugas");

    try {
      const list = await getAssignmentsList(session.accessToken);
      const assignment = list.assignments.find((a) => a.id === ctx.params.id);
      if (!assignment) throw new HttpError(404, "Tugas tidak ditemukan");

      const grades = await getMyGrades(session.accessToken);
      const mine = grades.results.find(
        (r) => r.assignmentId === assignment.id,
      );

      return page({
        assignment,
        dueLabel: dueLabelOf(assignment.deadline),
        userName: session.user.name,
        submitted: mine !== undefined,
        score: mine?.score ?? null,
        feedback: mine?.feedback ?? null,
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(404, "Tugas tidak ditemukan");
    }
  },
});

export default define.page<typeof handler>(({ data }: { data: DetailData }) => {
  const task = data.assignment;

  return (
    <>
      <Head>
        <title>{task.title} — SMA Muhammadiyah Imogiri</title>
      </Head>

      <a
        href="/tugas"
        class="text-sm font-semibold text-primary hover:text-primary-hover"
      >
        ← Kembali ke Daftar Tugas
      </a>

      <header class="mt-4">
        <div class="flex flex-wrap items-center gap-2">
          <Badge tone="guru">{task.subjectCode}</Badge>
          <span class="text-xs text-content-muted">{task.className}</span>
        </div>
        <h1 class="mt-2 text-2xl font-bold tracking-tight text-content sm:text-3xl">
          {task.title}
        </h1>
        <p class="mt-1 text-sm text-content-muted">
          {task.subjectName} • {TYPE_LABEL[task.type]}
        </p>
      </header>

      <div class="mt-6 grid gap-5 lg:grid-cols-3">
        <div class="space-y-5 lg:col-span-2">
          <Card title="Instruksi">
            <p class="text-sm leading-relaxed text-content">
              {task.instruction}
            </p>
          </Card>

          <Card
            title="Form Pengumpulan Jawaban"
            description="Jawab lalu kumpulkan"
          >
            <AssignmentAnswer
              assignmentId={task.id}
              taskTitle={task.title}
              kind={task.type}
              questions={task.questions}
              alreadySubmitted={data.submitted}
              studentName={data.userName}
              className={task.className}
            />
          </Card>
        </div>

        <div class="space-y-5">
          <Card title="Tenggat">
            <p class="text-2xl font-bold">{data.dueLabel}</p>
          </Card>

          <Card title="Detail">
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-content-muted">Mata pelajaran</dt>
                <dd class="text-content">{task.subjectName}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-content-muted">Jenis</dt>
                <dd class="text-content">{TYPE_LABEL[task.type]}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-content-muted">Kelas</dt>
                <dd class="text-content">{task.className}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Nilai & Komentar">
            {data.score == null
              ? (
                <p class="text-sm text-content-muted">
                  {data.submitted
                    ? "Menunggu penilaian guru."
                    : "Belum dinilai oleh guru."}
                </p>
              )
              : (
                <div>
                  <p class="text-3xl font-bold tabular-nums text-status-hadir">
                    {data.score}
                  </p>
                  {data.feedback && (
                    <blockquote class="mt-3 border-l-4 border-primary/40 pl-3 text-sm italic text-content">
                      “{data.feedback}”
                    </blockquote>
                  )}
                </div>
              )}
          </Card>
        </div>
      </div>
    </>
  );
});
