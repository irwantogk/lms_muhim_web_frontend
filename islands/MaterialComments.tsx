import { useEffect, useState } from "preact/hooks";
import type { MaterialComment } from "@/lib/server/backend.ts";
import { timeAgoLabel } from "@/lib/date.ts";

export interface MaterialCommentsProps {
  materialId: string;
}

const ROLE_LABEL: Record<string, string> = {
  guru: "Guru",
  admin: "Admin",
  murid: "Murid",
  orang_tua: "Orang Tua",
};

export default function MaterialComments(
  { materialId }: MaterialCommentsProps,
) {
  const [comments, setComments] = useState<MaterialComment[]>([]);
  const [canModerate, setCanModerate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/materi/${encodeURIComponent(materialId)}/comments`,
        );
        const json = await res.json().catch(() => ({})) as {
          ok?: boolean;
          data?: { canModerate?: boolean; comments?: MaterialComment[] };
          error?: string;
        };
        if (active) {
          if (json.ok && json.data) {
            setComments(json.data.comments ?? []);
            setCanModerate(json.data.canModerate === true);
          } else {
            setError(json.error ?? "Gagal memuat komentar.");
          }
        }
      } catch {
        if (active) setError("Gagal terhubung ke server.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [materialId]);

  async function send() {
    const text = body.trim();
    if (text.length < 3) {
      setError("Komentar minimal 3 karakter.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/materi/${encodeURIComponent(materialId)}/comments`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ body: text }),
        },
      );
      const json = await res.json().catch(() => ({})) as {
        ok?: boolean;
        data?: MaterialComment;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Gagal mengirim komentar.");
        return;
      }
      setComments((list) => [json.data!, ...list]);
      setBody("");
      flash("Komentar terkirim.");
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleHidden(comment: MaterialComment) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/materi/${encodeURIComponent(materialId)}/comments/${
          encodeURIComponent(comment.id)
        }`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ hidden: !comment.isHidden }),
        },
      );
      const json = await res.json().catch(() => ({})) as {
        ok?: boolean;
        data?: MaterialComment;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Gagal memoderasi komentar.");
        return;
      }
      const updated = json.data!;
      setComments((list) =>
        list.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(commentId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/materi/${encodeURIComponent(materialId)}/comments/${
          encodeURIComponent(commentId)
        }`,
        { method: "DELETE" },
      );
      const json = await res.json().catch(() => ({})) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Gagal menghapus komentar.");
        return;
      }
      setConfirmDelete(null);
      setComments((list) => list.filter((item) => item.id !== commentId));
      flash("Komentar dihapus.");
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setBusy(false);
    }
  }

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 3000);
  }

  return (
    <div class="grid gap-4">
      {error && (
        <div
          role="alert"
          class="rounded-md border border-status-sakit/30 bg-status-sakit/10 px-3 py-2 text-sm text-status-sakit"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          class="rounded-md border border-status-hadir/30 bg-status-hadir/10 px-3 py-2 text-sm text-status-hadir"
        >
          {notice}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        class="grid gap-2"
      >
        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
            Tulis komentar
          </span>
          <textarea
            rows={3}
            value={body}
            onInput={(event) =>
              setBody((event.target as HTMLTextAreaElement).value)}
            placeholder="Tanyakan atau beri tanggapan tentang materi ini…"
            maxLength={2000}
            class="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </label>
        <div class="flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={busy}
            class="rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {busy ? "Mengirim…" : "Kirim Komentar"}
          </button>
        </div>
      </form>

      {loading
        ? (
          <p class="py-4 text-center text-sm text-content-muted">
            Memuat komentar…
          </p>
        )
        : comments.length === 0
        ? (
          <p class="py-4 text-center text-sm text-content-muted">
            Belum ada komentar. Jadilah yang pertama memberi komentar.
          </p>
        )
        : (
          <ul class="space-y-3">
            {comments.map((comment) => (
              <li
                key={comment.id}
                class="rounded-md border border-border bg-surface-subtle p-3"
              >
                <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <div class="flex min-w-0 flex-wrap items-center gap-2">
                    <p class="text-xs font-semibold text-content">
                      {comment.authorName}
                    </p>
                    <span
                      class={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        comment.authorRole === "guru"
                          ? "bg-role-guru/10 text-role-guru"
                          : "bg-role-murid/10 text-role-murid"
                      }`}
                    >
                      {ROLE_LABEL[comment.authorRole] ?? comment.authorRole}
                    </span>
                    {comment.isHidden && (
                      <span class="inline-flex items-center rounded-full bg-status-terlambat/10 px-2 py-0.5 text-[10px] font-bold text-status-terlambat">
                        Disembunyikan
                      </span>
                    )}
                    <span class="text-xs text-content-muted">
                      {timeAgoLabel(comment.createdAt)}
                    </span>
                  </div>

                  {canModerate && (
                    <div class="flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[11px]">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleHidden(comment)}
                        class="font-semibold text-status-terlambat hover:underline disabled:opacity-50"
                      >
                        {comment.isHidden ? "Tampilkan" : "Sembunyikan"}
                      </button>
                      {confirmDelete === comment.id
                        ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => remove(comment.id)}
                              class="font-semibold text-status-sakit"
                            >
                              Yakin hapus?
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              class="font-semibold text-content-muted"
                            >
                              Batal
                            </button>
                          </>
                        )
                        : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirmDelete(comment.id)}
                            class="font-semibold text-status-sakit hover:underline disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        )}
                    </div>
                  )}
                </div>
                <p class="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-content">
                  {comment.body}
                </p>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
