import { useState } from "preact/hooks";

export interface ForumClassOption {
  id: string;
  name: string;
}

export interface ForumSubjectOption {
  id: string;
  name: string;
}

export interface ForumTopicFormProps {
  classOptions: ForumClassOption[];
  subjectOptions: ForumSubjectOption[];
  fixedClass?: ForumClassOption;
}

export default function ForumTopicForm({
  classOptions,
  subjectOptions,
  fixedClass,
}: ForumTopicFormProps) {
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    const resolvedClassId = fixedClass ? fixedClass.id : classId;
    if (!resolvedClassId) {
      setError("Pilih kelas tujuan diskusi.");
      return;
    }
    if (!subjectId) {
      setError("Pilih mata pelajaran.");
      return;
    }
    if (title.trim().length < 5) {
      setError("Judul topik minimal 5 karakter.");
      return;
    }
    if (body.trim().length < 10) {
      setError("Isi topik minimal 10 karakter.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          classId: resolvedClassId,
          subjectId,
          title: title.trim(),
          content: body.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Gagal membuat topik.");
        return;
      }
      globalThis.location.assign("/forum");
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="space-y-4">
      {fixedClass
        ? (
          <p class="text-sm text-content-muted">
            Kelas diskusi:{" "}
            <span class="font-medium text-content">{fixedClass.name}</span>
          </p>
        )
        : (
          <div>
            <label
              class="block text-xs font-medium text-content"
              for="topik-class"
            >
              Kelas
            </label>
            <select
              id="topik-class"
              value={classId}
              onChange={(event) =>
                setClassId((event.target as HTMLSelectElement).value)}
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
        )}

      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            class="block text-xs font-medium text-content"
            for="topik-subject"
          >
            Mata pelajaran
          </label>
          <select
            id="topik-subject"
            value={subjectId}
            onChange={(event) =>
              setSubjectId((event.target as HTMLSelectElement).value)}
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
        <div>
          <label
            class="block text-xs font-medium text-content"
            for="topik-title"
          >
            Judul topik
          </label>
          <input
            id="topik-title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle((event.target as HTMLInputElement).value)}
            placeholder="contoh: Diskusi soal latihan bab 3"
            class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-content" for="topik-body">
          Isi topik
        </label>
        <textarea
          id="topik-body"
          rows={5}
          value={body}
          onChange={(event) =>
            setBody((event.target as HTMLTextAreaElement).value)}
          placeholder="Jelaskan pertanyaan / hal yang ingin didiskusikan…"
          class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>

      {error && (
        <p role="alert" class="text-xs text-status-sakit">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {busy ? "Menyimpan…" : "Buat Topik"}
      </button>
    </div>
  );
}
