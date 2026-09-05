import { useEffect, useState } from "preact/hooks";

export type AssignmentKind = "pilihan_ganda" | "esai" | "upload" | "campuran";

export interface AssignmentClassOption {
  id: string;
  name: string;
}

export interface AssignmentSubjectOption {
  id: string;
  name: string;
}

export interface AssignmentFormProps {
  classOptions: AssignmentClassOption[];
  subjectOptions: AssignmentSubjectOption[];
}

interface Question {
  text: string;
  options: string[];
  multiple?: boolean;
  correct: number | number[];
}

const KIND_LABEL: Record<AssignmentKind, string> = {
  pilihan_ganda: "Pilihan Ganda",
  esai: "Esai",
  upload: "Unggah File",
  campuran: "Campuran (PG + Esai)",
};

function blankQuestion(): Question {
  return { text: "", options: ["", "", "", ""], multiple: false, correct: 0 };
}

function nowMinLocal(): string {
  const d = new Date(Date.now() + 15 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${
    pad(d.getHours())
  }:${pad(d.getMinutes())}`;
}

export default function AssignmentForm({
  classOptions,
  subjectOptions,
}: AssignmentFormProps) {
  const [kind, setKind] = useState<AssignmentKind>("pilihan_ganda");
  const [title, setTitle] = useState("");
  const [className, setClassName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [instruction, setInstruction] = useState("");
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState<Question[]>([blankQuestion()]);
  const [essayPrompts, setEssayPrompts] = useState<string[]>([""]);
  const [attachmentName, setAttachmentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!deadline) setDeadline(nowMinLocal());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateQuestion(index: number, patch: Partial<Question>) {
    setQuestions((list) =>
      list.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );
  }

  function addQuestion() {
    setQuestions((list) => [...list, blankQuestion()]);
  }

  function removeQuestion(index: number) {
    setQuestions((list) => list.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    if (!title.trim()) {
      setError("Judul tugas wajib diisi.");
      return false;
    }
    if (!className || !subjectCode) {
      setError("Pilih kelas dan mata pelajaran.");
      return false;
    }
    if (!instruction.trim()) {
      setError("Instruksi tugas wajib diisi.");
      return false;
    }
    const due = new Date(deadline);
    if (!deadline || Number.isNaN(due.getTime())) {
      setError("Tentukan tenggat (tanggal & jam).");
      return false;
    }
    if (due.getTime() <= Date.now()) {
      setError("Tenggat harus di masa mendatang.");
      return false;
    }
    if (kind === "pilihan_ganda" || kind === "campuran") {
      if (questions.length === 0) {
        setError(
          kind === "campuran"
            ? "Tambahkan minimal satu soal pilihan ganda."
            : "Tambahkan minimal satu soal pilihan ganda.",
        );
        return false;
      }
      const hasIncomplete = questions.some((q) => {
        if (!q.text.trim()) return true;
        return q.options.some((o) => !o.trim());
      });
      if (hasIncomplete) {
        setError("Lengkapi teks soal dan seluruh pilihan jawaban.");
        return false;
      }
      if (kind === "campuran") {
        if (essayPrompts.filter((text) => text.trim()).length === 0) {
          setError("Tambahkan minimal satu soal esai.");
          return false;
        }
        if (
          essayPrompts.some((text) => text.trim() && text.trim().length < 3)
        ) {
          setError("Lengkapi teks soal esai.");
          return false;
        }
      }
    }
    if (kind === "esai") {
      if (essayPrompts.filter((text) => text.trim()).length === 0) {
        setError("Tambahkan minimal satu soal esai.");
        return false;
      }
      if (essayPrompts.some((text) => text.trim() && text.trim().length < 3)) {
        setError("Lengkapi teks soal esai.");
        return false;
      }
    }
    return true;
  }

  async function submit() {
    setError(null);
    if (!validate()) return;

    type QuestionPayload = Question | { kind: "esai"; text: string };
    const payload: {
      classId: string;
      subjectId: string;
      title: string;
      instruction: string;
      type: AssignmentKind;
      deadline: string;
      questions?: QuestionPayload[];
    } = {
      classId: className,
      subjectId: subjectCode,
      title: title.trim(),
      instruction: instruction.trim(),
      type: kind,
      deadline: new Date(deadline).toISOString(),
    };
    if (kind === "pilihan_ganda") {
      payload.questions = questions;
    } else if (kind === "campuran") {
      payload.questions = [
        ...questions,
        ...essayPrompts
          .filter((text) => text.trim())
          .map((text) => ({ kind: "esai" as const, text: text.trim() })),
      ];
    } else if (kind === "esai") {
      payload.questions = essayPrompts
        .filter((text) => text.trim())
        .map((text) => ({ kind: "esai" as const, text: text.trim() }));
    }

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!result.ok) {
        throw new Error(result.error ?? "Gagal menyimpan tugas");
      }
      setDone(true);
      setTimeout(() => globalThis.location.assign("/tugas"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan tugas");
    }
  }

  return (
    <div class="space-y-4">
      {/* Jenis tugas */}
      <div>
        <p class="text-xs font-medium text-content">Jenis tugas</p>
        <div class="mt-1 flex flex-wrap gap-2">
          {(Object.keys(KIND_LABEL) as AssignmentKind[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              class={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                kind === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-content-muted hover:text-content"
              }`}
            >
              {KIND_LABEL[value]}
            </button>
          ))}
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            class="block text-xs font-medium text-content"
            for="tugas-title"
          >
            Judul tugas
          </label>
          <input
            id="tugas-title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle((event.target as HTMLInputElement).value)}
            placeholder="contoh: Kuis Turunan Fungsi"
            class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
        <div>
          <label
            class="block text-xs font-medium text-content"
            for="tugas-deadline"
          >
            Tenggat
          </label>
          <input
            id="tugas-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(event) =>
              setDeadline((event.target as HTMLInputElement).value)}
            class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            class="block text-xs font-medium text-content"
            for="tugas-class"
          >
            Kelas
          </label>
          <select
            id="tugas-class"
            value={className}
            onChange={(event) =>
              setClassName((event.target as HTMLSelectElement).value)}
            class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="">Pilih kelas…</option>
            {classOptions.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            class="block text-xs font-medium text-content"
            for="tugas-subject"
          >
            Mata pelajaran
          </label>
          <select
            id="tugas-subject"
            value={subjectCode}
            onChange={(event) =>
              setSubjectCode((event.target as HTMLSelectElement).value)}
            class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="">Pilih mapel…</option>
            {subjectOptions.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          class="block text-xs font-medium text-content"
          for="tugas-instruction"
        >
          Instruksi
        </label>
        <textarea
          id="tugas-instruction"
          rows={3}
          value={instruction}
          onChange={(event) =>
            setInstruction((event.target as HTMLTextAreaElement).value)}
          placeholder="Jelaskan cara pengerjaan tugas…"
          class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>

      {/* Konten per jenis */}
      {(kind === "pilihan_ganda" || kind === "campuran") && (
        <div class="rounded-lg border border-border bg-surface-subtle p-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-content">Soal pilihan ganda</p>
            <button
              type="button"
              onClick={addQuestion}
              class="rounded-md border border-border-strong bg-surface px-2.5 py-1 text-xs font-semibold text-content"
            >
              + Tambah soal
            </button>
          </div>
          <div class="mt-3 space-y-4">
            {questions.map((question, index) => (
              <div
                key={index}
                class="rounded-md border border-border bg-surface p-3"
              >
                <div class="flex items-center justify-between gap-2">
                  <p class="text-xs font-medium text-content-muted">
                    Soal {index + 1}
                  </p>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      class="text-xs font-semibold text-status-sakit"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={question.text}
                  onChange={(event) =>
                    updateQuestion(index, {
                      text: (event.target as HTMLInputElement).value,
                    })}
                  placeholder="Teks soal…"
                  class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                />
                <div class="mt-2 flex items-center gap-2">
                  <label class="flex items-center gap-1.5 text-xs text-content">
                    <input
                      type="checkbox"
                      checked={question.multiple === true}
                      onChange={(event) => {
                        if ((event.target as HTMLInputElement).checked) {
                          updateQuestion(index, {
                            multiple: true,
                            correct: [],
                          });
                        } else {
                          updateQuestion(index, {
                            multiple: false,
                            correct: 0,
                          });
                        }
                      }}
                    />
                    Pilihan ganda (boleh &gt;1 jawaban)
                  </label>
                </div>
                {question.multiple && (
                  <p class="mt-1 text-[11px] font-semibold text-role-murid">
                    Murid dapat memilih lebih dari satu jawaban yang benar.
                  </p>
                )}
                <div class="mt-2 space-y-1.5">
                  {question.options.map((option, optionIndex) => {
                    const multiKeys = question.multiple
                      ? Array.isArray(question.correct) ? question.correct : []
                      : [];
                    const isChecked = question.multiple
                      ? multiKeys.includes(optionIndex)
                      : question.correct === optionIndex;
                    return (
                      <div key={optionIndex} class="flex items-center gap-2">
                        <label class="flex shrink-0 items-center gap-1 text-xs text-content-muted">
                          <input
                            type={question.multiple ? "checkbox" : "radio"}
                            name={question.multiple
                              ? `multi-${index}`
                              : `correct-${index}`}
                            checked={isChecked}
                            onChange={() => {
                              if (question.multiple) {
                                const next = new Set(
                                  multiKeys.includes(optionIndex)
                                    ? multiKeys.filter((k) =>
                                      k !== optionIndex
                                    )
                                    : [...multiKeys, optionIndex],
                                );
                                updateQuestion(index, {
                                  correct: [...next].sort((a, b) => a - b),
                                });
                              } else {
                                updateQuestion(index, { correct: optionIndex });
                              }
                            }}
                          />
                          {String.fromCharCode(65 + optionIndex)}
                        </label>
                        <input
                          type="text"
                          value={option}
                          onChange={(event) => {
                            const next = [...question.options];
                            next[optionIndex] =
                              (event.target as HTMLInputElement).value;
                            updateQuestion(index, { options: next });
                          }}
                          placeholder={`Pilihan ${
                            String.fromCharCode(65 + optionIndex)
                          }`}
                          class="w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(kind === "campuran" || kind === "esai") && (
        <div class="rounded-lg border border-border bg-surface-subtle p-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-content">Soal esai</p>
            <button
              type="button"
              onClick={() => setEssayPrompts((list) => [...list, ""])}
              class="rounded-md border border-border-strong bg-surface px-2.5 py-1 text-xs font-semibold text-content"
            >
              + Tambah soal esai
            </button>
          </div>
          <div class="mt-3 space-y-3">
            {essayPrompts.map((prompt, index) => (
              <div
                key={index}
                class="rounded-md border border-border bg-surface p-3"
              >
                <div class="flex items-center justify-between gap-2">
                  <p class="text-xs font-medium text-content-muted">
                    Soal esai {index + 1}
                  </p>
                  {essayPrompts.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setEssayPrompts((list) =>
                          list.filter((_, i) => i !== index)
                        )}
                      class="text-xs font-semibold text-status-sakit"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(event) =>
                    setEssayPrompts((list) =>
                      list.map((value, i) =>
                        i === index
                          ? (event.target as HTMLTextAreaElement).value
                          : value
                      )
                    )}
                  placeholder="Teks soal esai…"
                  class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {kind === "esai" && (
        <p class="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-content-muted">
          Murid menjawab dalam bentuk teks esai berdasarkan instruksi di atas.
        </p>
      )}
      {kind === "upload" && (
        <div class="rounded-lg border border-border bg-surface-subtle p-3">
          <p class="text-sm font-semibold text-content">
            Berkas tugas (contoh/lampiran)
          </p>
          <p class="mt-0.5 text-xs text-content-muted">
            Opsional — berkas contoh yang bisa diunduh murid. Murid akan
            mengunggah jawaban file-nya saat mengumpulkan.
          </p>
          <input
            id="tugas-attachment"
            type="file"
            onChange={(event) => {
              const file = (event.target as HTMLInputElement).files?.[0];
              setAttachmentName(file?.name ?? "");
            }}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
            class="mt-2 block w-full cursor-pointer rounded-md border border-dashed border-border-strong bg-surface px-3 py-2 text-sm text-content-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          />
          {attachmentName && (
            <p class="mt-1 text-xs text-content-muted">
              Berkas terpilih: {attachmentName}{" "}
              (pratinjau — penyimpanan lampiran menyusul)
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" class="text-xs text-status-sakit">
          {error}
        </p>
      )}

      {done && (
        <div
          role="status"
          class="rounded-md border border-status-hadir/40 bg-status-hadir/10 px-3 py-2 text-sm font-medium text-status-hadir"
        >
          Tugas tersimpan ✓ — mengalihkan ke daftar tugas…
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Simpan Tugas
      </button>
    </div>
  );
}
