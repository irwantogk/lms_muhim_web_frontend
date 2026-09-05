import { useState } from "preact/hooks";

export interface GradingFormProps {
  assignmentId: string;
  submissionId: string;
  initialScore: number | null;
  initialComment: string | null;
}

export default function GradingForm({
  assignmentId,
  submissionId,
  initialScore,
  initialComment,
}: GradingFormProps) {
  const [score, setScore] = useState(
    initialScore == null ? "" : String(initialScore),
  );
  const [comment, setComment] = useState(initialComment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    const numeric = Number(score);
    if (score.trim() === "" || !Number.isFinite(numeric)) {
      setError("Isi nilai (0–100).");
      return;
    }
    if (numeric < 0 || numeric > 100 || !Number.isInteger(numeric)) {
      setError("Nilai harus bilangan bulat 0–100.");
      return;
    }
    if (comment.trim().length > 500) {
      setError("Komentar maksimal 500 karakter.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/grade/${submissionId}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            score: numeric,
            feedback: comment.trim() || undefined,
          }),
        },
      );
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!result.ok) {
        throw new Error(result.error ?? "Gagal menyimpan nilai");
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan nilai");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-content" for="nilai-input">
          Nilai (0–100)
        </label>
        <input
          id="nilai-input"
          type="number"
          min={0}
          max={100}
          value={score}
          onChange={(event) =>
            setScore((event.target as HTMLInputElement).value)}
          class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:max-w-40"
        />
      </div>

      <div>
        <label
          class="block text-xs font-medium text-content"
          for="komentar-input"
        >
          Komentar untuk murid
        </label>
        <textarea
          id="komentar-input"
          rows={4}
          value={comment}
          onChange={(event) =>
            setComment((event.target as HTMLTextAreaElement).value)}
          placeholder="Berikan umpan balik / komentar…"
          class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        <p class="mt-1 text-xs text-content-muted">
          {comment.length}/500 karakter
        </p>
      </div>

      {error && (
        <p role="alert" class="text-xs text-status-sakit">
          {error}
        </p>
      )}
      {saved && (
        <p
          role="status"
          class="rounded-md border border-status-hadir/40 bg-status-hadir/10 px-3 py-2 text-sm font-medium text-status-hadir"
        >
          Nilai & komentar tersimpan ✓
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {saving ? "Menyimpan…" : "Simpan Nilai"}
      </button>
    </div>
  );
}
