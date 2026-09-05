import { useState } from "preact/hooks";

export interface TopicModerationProps {
  topicId: string;
  title: string;
  initialHidden: boolean;
}

type State = "idle" | "confirm-hide" | "confirm-delete";

export default function TopicModeration({
  topicId,
  title,
  initialHidden,
}: TopicModerationProps) {
  const [hidden, setHidden] = useState(initialHidden);
  const [state, setState] = useState<State>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "hide" | "show" | "delete") {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/forum/moderate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "topic", id: topicId, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Gagal memoderasi topik.");
        return;
      }
      setState("idle");
      if (action === "delete") {
        globalThis.location.assign("/forum");
        return;
      }
      setHidden(action === "hide");
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setBusy(false);
    }
  }

  if (hidden) {
    return (
      <div class="mt-2 rounded-md border border-status-terlambat/40 bg-status-terlambat/10 px-3 py-2 text-sm text-status-terlambat">
        <p>
          Topik "{title}" disembunyikan dari murid.
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => act("show")}
            class="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            Tampilkan kembali
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setState("confirm-delete")}
            class="rounded-md border border-status-sakit/40 px-3 py-1.5 text-xs font-semibold text-status-sakit hover:bg-status-sakit/10 disabled:opacity-50"
          >
            Hapus topik
          </button>
        </div>
        {state === "confirm-delete" && (
          <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span>Yakin hapus topik ini?</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => act("delete")}
              class="font-semibold text-status-sakit"
            >
              Ya, hapus
            </button>
            <button
              type="button"
              onClick={() => setState("idle")}
              class="font-semibold text-content-muted"
            >
              Batal
            </button>
          </div>
        )}
        {error && <p class="mt-1 text-xs text-status-sakit">{error}</p>}
      </div>
    );
  }

  if (state === "confirm-hide" || state === "confirm-delete") {
    const isDelete = state === "confirm-delete";
    return (
      <div class="mt-2 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
        <p class="text-content">
          {isDelete
            ? `Hapus topik "${title}"? Tindakan tidak bisa dibatalkan.`
            : `Sembunyikan topik "${title}" dari murid?`}
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => act(isDelete ? "delete" : "hide")}
            class="rounded-md bg-status-sakit px-3 py-1.5 text-xs font-semibold text-white hover:bg-status-sakit/90 disabled:opacity-50"
          >
            {busy ? "Memproses…" : isDelete ? "Ya, Hapus" : "Ya, Sembunyikan"}
          </button>
          <button
            type="button"
            onClick={() => setState("idle")}
            class="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-content-muted"
          >
            Batal
          </button>
        </div>
        {error && <p class="mt-1 text-xs text-status-sakit">{error}</p>}
      </div>
    );
  }

  return (
    <div class="mt-2 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setState("confirm-hide")}
        class="rounded-md border border-status-terlambat/40 px-2.5 py-1 text-xs font-semibold text-status-terlambat hover:bg-status-terlambat/10"
      >
        Sembunyikan
      </button>
      <button
        type="button"
        onClick={() => setState("confirm-delete")}
        class="rounded-md border border-status-sakit/40 px-2.5 py-1 text-xs font-semibold text-status-sakit hover:bg-status-sakit/10"
      >
        Hapus
      </button>
      {error && <p class="text-xs text-status-sakit">{error}</p>}
    </div>
  );
}
