import { useRef, useState } from "preact/hooks";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

export default function PhotoUpload({ photoUrl }: { photoUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const dot = file.name.lastIndexOf(".");
    const ext = dot === -1 ? "" : file.name.slice(dot + 1).toLowerCase();
    if (!ALLOWED.has(ext)) {
      setError("Gunakan foto PNG, JPG, WEBP, atau GIF.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Foto maksimal 5 MB.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const presignRes = await fetch("/api/me-photo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
      });
      const presign = await presignRes.json() as {
        ok?: boolean;
        data?: { uploadUrl: string; fileUrl: string };
        error?: string;
      };
      if (!presign.ok || !presign.data) {
        throw new Error(presign.error ?? "Gagal meminta izin unggah");
      }

      const upload = await fetch(presign.data.uploadUrl, {
        method: "PUT",
        body: file,
      });
      if (!upload.ok) throw new Error("Gagal mengunggah berkas");

      const confirmRes = await fetch("/api/me-photo-confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photoUrl: presign.data.fileUrl }),
      });
      const confirm = await confirmRes.json() as {
        ok?: boolean;
        error?: string;
      };
      if (!confirm.ok) throw new Error(confirm.error ?? "Gagal menyimpan foto");

      globalThis.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah foto");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="flex flex-col items-center gap-3">
      {photoUrl
        ? (
          <img
            src={photoUrl}
            alt="Foto profil"
            class="h-24 w-24 rounded-full object-cover ring-2 ring-border"
          />
        )
        : (
          <span class="flex h-24 w-24 items-center justify-center rounded-full bg-surface-muted text-3xl font-bold text-content-muted">
            ?
          </span>
        )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        class="hidden"
        onChange={(event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file) handleFile(file);
        }}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        class="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-content transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
      >
        {busy ? "Mengunggah…" : "Ganti Foto"}
      </button>

      {error && (
        <p class="max-w-64 text-center text-xs text-status-sakit">{error}</p>
      )}
    </div>
  );
}
