import { HttpError, page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import {
  type AssignmentApiItem,
  getAssignmentsList,
  getSubmissionsList,
  type SubmissionApiItem,
} from "@/lib/server/backend.ts";
import { Badge } from "@/components/ui/Badge.tsx";
import { Card } from "@/components/ui/Card.tsx";
import GradingForm from "@/islands/GradingForm.tsx";

interface NilaiData {
  assignment: AssignmentApiItem;
  submission: SubmissionApiItem;
  collected: boolean;
}

const LETTERS = "ABCD".split("");

function answerView(data: NilaiData) {
  const { assignment, submission } = data;
  const answer = submission.answer as Record<string, unknown> | null;
  if (!answer) return null;

  if (assignment.type === "upload") {
    const fileName = typeof answer.fileName === "string"
      ? answer.fileName
      : "berkas";
    return (
      <div class="rounded-md border border-dashed border-border-strong bg-surface-muted px-3 py-6 text-center">
        <p class="text-sm font-medium text-content">{fileName}</p>
        <p class="text-xs text-content-muted">Berkas jawaban murid.</p>
      </div>
    );
  }

  if (assignment.type === "esai") {
    const raw = Array.isArray(answer.answers)
      ? (answer.answers as unknown[]).filter((x): x is string =>
        typeof x === "string"
      ).join("\n\n")
      : typeof answer.text === "string"
      ? answer.text
      : "";
    return (
      <p class="whitespace-pre-wrap rounded-md bg-surface-muted p-3 text-sm leading-relaxed text-content">
        {raw || "Jawaban tidak tersedia."}
      </p>
    );
  }

  // pilihan_ganda & campuran: render tiap soal sesuai jenisnya
  const chosen = Array.isArray(answer.answers)
    ? (answer.answers as Array<number | string>)
    : [];
  const items = assignment.questions ?? [];
  if (items.length === 0) {
    return <p class="text-sm text-content-muted">Jawaban tersimpan.</p>;
  }

  return (
    <ol class="space-y-4">
      {items.map((question, index) => {
        if (question.kind === "esai") {
          const text = typeof chosen[index] === "string"
            ? (chosen[index] as string)
            : "";
          return (
            <li
              key={index}
              class="rounded-md border border-border bg-surface-subtle p-3"
            >
              <p class="text-sm font-medium text-content">
                {index + 1}. {question.text}
              </p>
              <p class="mt-2 whitespace-pre-wrap rounded bg-surface-muted p-2 text-sm text-content">
                {text || "Jawaban tidak tersedia."}
              </p>
            </li>
          );
        }
        const keys = Array.isArray(question.correct)
          ? question.correct
          : [question.correct];
        const raw = chosen[index];
        const picked = Array.isArray(raw)
          ? raw
          : typeof raw === "number"
          ? [raw]
          : [];
        const benar = keys.length > 0 &&
          keys.every((k) => picked.includes(k)) &&
          picked.every((p) => keys.includes(p));
        return (
          <li
            key={index}
            class="rounded-md border border-border bg-surface-subtle p-3"
          >
            {question.multiple && (
              <p class="mb-1 text-[11px] font-semibold text-role-murid">
                (Pilih lebih dari satu jawaban yang benar)
              </p>
            )}
            <p class="text-sm font-medium text-content">
              {index + 1}. {question.text}
            </p>
            <div class="mt-2 space-y-1 text-sm">
              {question.options.map((_option, optionIndex) => {
                const isKey = keys.includes(optionIndex);
                const isMurid = picked.includes(optionIndex);
                let className = "rounded border px-2 py-1 text-xs font-medium ";
                if (isKey) {
                  className +=
                    "border-status-hadir/50 bg-status-hadir/10 text-status-hadir";
                } else if (isMurid) {
                  className +=
                    "border-status-sakit/50 bg-status-sakit/10 text-status-sakit";
                } else {
                  className += "border-border bg-surface text-content-muted";
                }
                return (
                  <span key={optionIndex} class={className}>
                    {LETTERS[optionIndex]}
                    {isKey ? " — Kunci ✓" : ""}
                    {isMurid && !isKey ? " — Jawaban murid" : ""}
                  </span>
                );
              })}
            </div>
            <p
              class={`mt-2 text-xs font-semibold ${
                benar ? "text-status-hadir" : "text-status-sakit"
              }`}
            >
              {benar ? "Benar" : "Salah"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "guru") return ctx.redirect("/tugas");

    try {
      const list = await getAssignmentsList(session.accessToken);
      const assignment = list.assignments.find((a) => a.id === ctx.params.id);
      if (!assignment) throw new HttpError(404, "Tugas tidak ditemukan");

      const rows = await getSubmissionsList(session.accessToken, assignment.id);
      const submission = rows.find((row) =>
        row.studentId === ctx.params.studentId
      );
      if (!submission) {
        throw new HttpError(404, "Murid belum mengumpulkan tugas ini");
      }

      return page({ assignment, submission, collected: true });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(404, "Tugas tidak ditemukan");
    }
  },
});

export default define.page<typeof handler>(({ data }: { data: NilaiData }) => {
  const { assignment, submission } = data;
  return (
    <>
      <Head>
        <title>Nilai — {submission.studentName}</title>
      </Head>

      <a
        href={`/tugas/${assignment.id}/kumpulan`}
        class="text-sm font-semibold text-primary hover:text-primary-hover"
      >
        ← Kembali ke Daftar Pengumpul
      </a>

      <header class="mt-4">
        <div class="flex flex-wrap items-center gap-2">
          <Badge tone="guru">{assignment.className}</Badge>
          <span class="text-xs text-content-muted">
            {assignment.subjectName}
          </span>
        </div>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
          Nilai & Komentar
        </h1>
        <p class="mt-1 text-sm text-content-muted">
          {submission.studentName} • {assignment.title}
        </p>
      </header>

      <div class="mt-6 grid gap-5 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <Card title="Jawaban Murid" description="Dari API">
            {data.collected ? answerView(data) : <p>Belum mengumpulkan.</p>}
          </Card>
        </div>

        <div>
          <Card title="Penilaian" description="Simpan nilai & komentar">
            <GradingForm
              assignmentId={assignment.id}
              submissionId={submission.id}
              initialScore={submission.score}
              initialComment={submission.feedback}
            />
          </Card>
        </div>
      </div>
    </>
  );
});
