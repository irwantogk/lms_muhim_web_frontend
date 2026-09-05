import { useState } from "preact/hooks";

export type AssignmentKind = "pilihan_ganda" | "esai" | "upload" | "campuran";

export type TaskQuestion =
  | {
    kind?: "pilihan_ganda";
    text: string;
    options: string[];
    multiple?: boolean;
    correct: number | number[];
  }
  | { kind: "esai"; text: string };

export interface AssignmentAnswerProps {
  assignmentId: string;
  taskTitle: string;
  kind: AssignmentKind;
  questions: TaskQuestion[] | null;
  alreadySubmitted: boolean;
  studentName: string;
  className: string;
}

const KIND_LABEL: Record<AssignmentKind, string> = {
  pilihan_ganda: "Pilihan Ganda",
  esai: "Esai",
  upload: "Unggah File",
  campuran: "Campuran",
};

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(0, Math.round(bytes / 1024))} KB`;
}

export default function AssignmentAnswer({
  assignmentId,
  taskTitle,
  kind,
  questions,
  alreadySubmitted,
  studentName,
  className,
}: AssignmentAnswerProps) {
  const items = questions ?? [];
  const itemCount = items.length;
  const [answers, setAnswers] = useState<(number | number[] | string | null)[]>(
    Array.from({ length: itemCount }, () => null),
  );
  const [essay, setEssay] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submittedNow, setSubmittedNow] = useState(false);

  const isMixed = kind === "pilihan_ganda" || kind === "campuran";
  const usesItems = isMixed || (kind === "esai" && itemCount > 0);

  function setAnswer(index: number, value: number | number[] | string) {
    setAnswers((list) => list.map((item, i) => (i === index ? value : item)));
  }

  async function submit() {
    setError(null);
    const body: {
      answers?: Array<number | number[] | string>;
      text?: string;
      fileName?: string;
    } = {};

    if (usesItems) {
      if (itemCount === 0) {
        setError("Tugas ini belum memiliki soal.");
        return;
      }
      const filled = answers.every((a) => a !== null);
      if (!filled) {
        setError("Jawab seluruh soal terlebih dahulu.");
        return;
      }
      body.answers = answers.map((a) => a ?? 0);
    } else if (kind === "esai" && itemCount === 0) {
      const text = essay.trim();
      if (text.length < 20) {
        setError("Jawaban esai minimal 20 karakter.");
        return;
      }
      body.text = text;
    } else {
      if (!fileName) {
        setError("Pilih file jawaban.");
        return;
      }
      body.fileName = fileName;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!result.ok) {
        throw new Error(result.error ?? "Gagal mengumpulkan");
      }
      setSubmittedNow(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengumpulkan");
    } finally {
      setSaving(false);
    }
  }

  if (alreadySubmitted || submittedNow) {
    return (
      <div class="rounded-md border border-status-hadir/40 bg-status-hadir/10 px-3 py-2 text-sm text-status-hadir">
        Jawaban berhasil dikumpulkan — tunggu nilai dari guru.
      </div>
    );
  }

  return (
    <div class="space-y-4">
      <div class="grid gap-2 rounded-md border border-border bg-surface-subtle p-3 text-sm sm:grid-cols-2">
        <div>
          <p class="text-xs text-content-muted">Pengumpul</p>
          <p class="font-medium text-content">{studentName}</p>
        </div>
        <div>
          <p class="text-xs text-content-muted">Kelas</p>
          <p class="font-medium text-content">{className}</p>
        </div>
      </div>

      {usesItems && items.length > 0 && (
        <ol class="space-y-4">
          {items.map((question, index) => {
            if (question.kind === "esai") {
              return (
                <li
                  key={index}
                  class="rounded-md border border-border bg-surface-subtle p-3"
                >
                  <p class="text-sm font-medium text-content">
                    {index + 1}. {question.text}
                  </p>
                  <textarea
                    rows={4}
                    value={typeof answers[index] === "string"
                      ? answers[index] as string
                      : ""}
                    onChange={(event) =>
                      setAnswer(
                        index,
                        (event.target as HTMLTextAreaElement).value,
                      )}
                    placeholder="Tulis jawaban esai…"
                    class="mt-2 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                </li>
              );
            }
            return (
              <li
                key={index}
                class="rounded-md border border-border bg-surface-subtle p-3"
              >
                <p class="text-sm font-medium text-content">
                  {index + 1}. {question.text}
                </p>
                {question.multiple && (
                  <p class="mt-1 text-[11px] font-semibold text-role-murid">
                    (Pilih lebih dari satu jawaban yang benar)
                  </p>
                )}
                <div class="mt-2 space-y-1.5">
                  {question.options.map((option, optionIndex) => {
                    const current = answers[index];
                    const list = Array.isArray(current)
                      ? current
                      : typeof current === "number"
                      ? [current]
                      : [];
                    const checked = question.multiple
                      ? list.includes(optionIndex)
                      : current === optionIndex;
                    return (
                      <label
                        key={optionIndex}
                        class="flex items-center gap-2 text-sm text-content"
                      >
                        <input
                          type={question.multiple ? "checkbox" : "radio"}
                          name={`q-${index}`}
                          checked={checked}
                          onChange={() => {
                            if (question.multiple) {
                              const next = list.includes(optionIndex)
                                ? list.filter((k) => k !== optionIndex)
                                : [...list, optionIndex].sort((a, b) => a - b);
                              setAnswer(index, next);
                            } else {
                              setAnswer(index, optionIndex);
                            }
                          }}
                        />
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </label>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {kind === "esai" && itemCount === 0 && (
        <div>
          <label
            class="block text-xs font-medium text-content"
            for="essay-answer"
          >
            Jawaban esai
          </label>
          <textarea
            id="essay-answer"
            rows={8}
            value={essay}
            onChange={(event) =>
              setEssay((event.target as HTMLTextAreaElement).value)}
            placeholder={`Tulis jawaban untuk "${taskTitle}"…`}
            class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <p class="mt-1 text-xs text-content-muted">
            {essay.trim().length} karakter (min. 20)
          </p>
        </div>
      )}

      {kind === "upload" && (
        <div>
          <label
            class="block text-xs font-medium text-content"
            for="answer-file"
          >
            Unggah file jawaban
          </label>
          <input
            id="answer-file"
            type="file"
            onChange={(event) => {
              const file = (event.target as HTMLInputElement).files?.[0];
              setFileName(file?.name ?? "");
              setFileSize(file?.size ?? 0);
            }}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.png"
            class="mt-1 block w-full cursor-pointer rounded-md border border-dashed border-border-strong bg-surface px-3 py-2 text-sm text-content-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          />
          {fileName && (
            <p class="mt-1 text-xs text-content-muted">
              Dipilih: {fileName} ({formatBytes(fileSize)})
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" class="text-xs text-status-sakit">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {saving ? "Mengirim…" : `Kumpulkan ${KIND_LABEL[kind]}`}
      </button>
    </div>
  );
}
