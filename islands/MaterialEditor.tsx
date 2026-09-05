import { useRef, useState } from "preact/hooks";

export interface MaterialEditorOption {
  id: string;
  name: string;
}

export interface MaterialEditorProps {
  classOptions: MaterialEditorOption[];
  subjectOptions: MaterialEditorOption[];
}

interface Tool {
  label: string;
  command: string;
  value?: string;
  title: string;
}

const TOOLS: Tool[] = [
  { label: "B", command: "bold", title: "Tebal" },
  { label: "I", command: "italic", title: "Miring" },
  { label: "U", command: "underline", title: "Garis bawah" },
  { label: "H2", command: "formatBlock", value: "H2", title: "Sub-judul" },
  { label: "H3", command: "formatBlock", value: "H3", title: "Sub-sub-judul" },
  { label: "•", command: "insertUnorderedList", title: "Daftar bullet" },
  { label: "1.", command: "insertOrderedList", title: "Daftar nomor" },
  {
    label: "“”",
    command: "formatBlock",
    value: "BLOCKQUOTE",
    title: "Kutipan",
  },
];

export default function MaterialEditor({
  classOptions,
  subjectOptions,
}: MaterialEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState("");
  const [className, setClassName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function runTool(tool: Tool) {
    document.execCommand(tool.command, false, tool.value ?? "");
    editorRef.current?.focus();
  }

  async function save() {
    const contentElement = editorRef.current;
    const text = contentElement?.textContent?.trim() ?? "";
    if (!title.trim()) {
      setError("Judul materi wajib diisi.");
      return;
    }
    if (!className || !subjectCode) {
      setError("Pilih kelas dan mata pelajaran.");
      return;
    }
    if (!text) {
      setError("Ketik isi materi terlebih dahulu.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/materi-content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          classId: className,
          subjectId: subjectCode,
          title: title.trim(),
          content: contentElement?.innerHTML ?? "",
        }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!result.ok) {
        throw new Error(result.error ?? "Gagal menyimpan materi");
      }
      globalThis.location.assign("/materi");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan materi");
      setSaving(false);
    }
  }

  return (
    <div class="space-y-3">
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="sm:col-span-1">
          <label
            class="block text-xs font-medium text-content"
            for="note-title"
          >
            Judul materi
          </label>
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle((event.target as HTMLInputElement).value)}
            placeholder="contoh: Turunan Fungsi — Bagian 1"
            class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
        <div>
          <label
            class="block text-xs font-medium text-content"
            for="note-class"
          >
            Kelas
          </label>
          <select
            id="note-class"
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
            for="note-subject"
          >
            Mata pelajaran
          </label>
          <select
            id="note-subject"
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

      <div class="rounded-lg border border-border-strong bg-surface">
        <div class="flex flex-wrap items-center gap-1 border-b border-border bg-surface-muted px-2 py-1.5">
          {TOOLS.map((tool) => (
            <button
              key={tool.label}
              type="button"
              title={tool.title}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => runTool(tool)}
              class="rounded-md px-2 py-1 text-xs font-semibold text-content transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {tool.label}
            </button>
          ))}
        </div>
        <div
          ref={editorRef}
          contentEditable
          data-placeholder="Mulai menulis materi di sini…"
          class="prose-editor min-h-[320px] px-4 py-3 text-sm text-content focus-visible:outline-none"
        />
      </div>

      {error && (
        <p role="alert" class="text-xs text-status-sakit">
          {error}
        </p>
      )}

      <div class="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan Materi"}
        </button>
        <a
          href="/materi"
          class="rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-content-muted transition-colors hover:text-content"
        >
          Batal
        </a>
      </div>
    </div>
  );
}
