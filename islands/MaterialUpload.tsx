import { useEffect, useRef, useState } from "preact/hooks";

export type MaterialKind = "pdf" | "video" | "dokumen";

export interface MaterialUploadClassOption {
  id: string;
  name: string;
}

export interface MaterialUploadSubjectOption {
  id: string;
  name: string;
}

export interface MaterialUploadProps {
  classOptions: MaterialUploadClassOption[];
  subjectOptions: MaterialUploadSubjectOption[];
}

const KIND_LABEL: Record<MaterialKind, string> = {
  pdf: "PDF",
  video: "Video",
  dokumen: "Dokumen",
};

function kindOf(name: string): MaterialKind | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "video";
  if (
    ["doc", "docx", "ppt", "pptx", "xls", "xlsx", "odt", "txt"].includes(ext)
  ) {
    return "dokumen";
  }
  return null;
}

function maxSizeFor(kind: MaterialKind): number {
  return kind === "video" ? 200 * 1024 * 1024 : 20 * 1024 * 1024;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export default function MaterialUpload({
  classOptions,
  subjectOptions,
}: MaterialUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [kind, setKind] = useState<MaterialKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [className, setClassName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), 2000);
    return () => clearTimeout(timer);
  }, [done]);

  function validateFile(file: File): MaterialKind | null {
    const detected = kindOf(file.name);
    if (!detected) {
      setError(
        "Jenis berkas tidak didukung. Gunakan PDF, video (MP4/WebM/MOV), atau dokumen (DOC/DOCX/PPT/XLS/TXT).",
      );
      setKind(null);
      setFileName("");
      setFileSize(0);
      return null;
    }
    const limit = maxSizeFor(detected);
    if (file.size > limit) {
      setError(
        `Berkas terlalu besar. Maksimum ${formatBytes(limit)} untuk jenis ${
          KIND_LABEL[detected]
        }.`,
      );
      setKind(null);
      setFileName("");
      setFileSize(0);
      return null;
    }
    setError(null);
    setKind(detected);
    setFileName(file.name);
    setFileSize(file.size);
    setTitle((
      prev,
    ) => (prev.trim() ? prev : file.name.replace(/\.[^.]+$/, "")));
    return detected;
  }

  function handleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setError("Pilih berkas terlebih dahulu.");
      return;
    }
    validateFile(file);
  }

  function resetForm() {
    if (inputRef.current) inputRef.current.value = "";
    setFileName("");
    setFileSize(0);
    setKind(null);
    setClassName("");
    setSubjectCode("");
    setTitle("");
    setDescription("");
  }

  async function handleSubmit() {
    const input = inputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      setError("Pilih berkas terlebih dahulu.");
      return;
    }
    const detected = validateFile(file);
    if (!detected) return;

    if (!className) {
      setError("Pilih kelas terlebih dahulu.");
      return;
    }
    if (!subjectCode) {
      setError("Pilih mata pelajaran terlebih dahulu.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      // 1. Minta presigned URL dari server
      const presignRes = await fetch("/api/materi-presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          classId: className,
          subjectId: subjectCode,
          fileName: file.name,
          fileSize: file.size,
        }),
      });
      const presign = await presignRes.json() as {
        ok: boolean;
        error?: string;
        data?: { uploadUrl: string; key: string };
      };
      if (!presign.ok || !presign.data) {
        throw new Error(presign.error ?? "Gagal meminta izin unggah");
      }

      // 2. Upload bytes langsung ke S3/MinIO (dibebankan ke client)
      const upload = await fetch(presign.data.uploadUrl, {
        method: "PUT",
        body: file,
      });
      if (!upload.ok) {
        throw new Error(`Gagal mengunggah berkas (${upload.status})`);
      }

      // 3. Catat metadata materi
      const confirmRes = await fetch("/api/materi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          classId: className,
          subjectId: subjectCode,
          key: presign.data.key,
          title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
          description: description.trim() || undefined,
        }),
      });
      const confirm = await confirmRes.json() as {
        ok?: boolean;
        error?: string;
      };
      if (!confirm.ok) {
        throw new Error(confirm.error ?? "Gagal mencatat materi");
      }

      setDone(true);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unggah gagal");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div class="mb-3">
        <label
          class="block text-xs font-medium text-content"
          for="mat-upload-title"
        >
          Judul materi
        </label>
        <input
          id="mat-upload-title"
          type="text"
          value={title}
          onChange={(event) =>
            setTitle((event.target as HTMLInputElement).value)}
          placeholder="Diisi otomatis dari nama berkas"
          class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>
      <div class="mb-3">
        <label
          class="block text-xs font-medium text-content"
          for="mat-upload-desc"
        >
          Deskripsi (informasi tambahan)
        </label>
        <textarea
          id="mat-upload-desc"
          rows={3}
          value={description}
          onChange={(event) =>
            setDescription((event.target as HTMLTextAreaElement).value)}
          placeholder="contoh: materi pertemuan 4, baca bab 3 dulu, tugas menyusul…"
          class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <div>
          <label
            class="block text-xs font-medium text-content"
            for="mat-upload-file"
          >
            Berkas (PDF / video / dokumen)
          </label>
          <input
            ref={inputRef}
            id="mat-upload-file"
            type="file"
            onChange={handleChange}
            accept=".pdf,.mp4,.webm,.mov,.m4v,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.txt"
            class="mt-1 block w-full cursor-pointer rounded-md border border-dashed border-border-strong bg-surface px-3 py-2 text-sm text-content-muted file:mr-3 file:rounded-md file:border-0 file:bg-role-guru file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          {fileName && kind && (
            <p class="mt-1 text-xs text-content-muted">
              {fileName} ({formatBytes(fileSize)}) — {KIND_LABEL[kind]}
            </p>
          )}
        </div>

        <div>
          <label
            class="block text-xs font-medium text-content"
            for="mat-upload-class"
          >
            Kelas
          </label>
          <select
            id="mat-upload-class"
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
            for="mat-upload-subject"
          >
            Mata pelajaran
          </label>
          <select
            id="mat-upload-subject"
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

      {error && (
        <p role="alert" class="mt-2 text-xs text-status-sakit">
          {error}
        </p>
      )}
      {done && (
        <p role="status" class="mt-2 text-xs font-medium text-status-hadir">
          Materi berhasil diunggah ke penyimpanan (presigned URL) ✓
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={uploading}
        class="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {uploading ? "Mengunggah…" : "Unggah"}
      </button>
    </div>
  );
}
