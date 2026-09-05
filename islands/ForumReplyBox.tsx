import { useState } from "preact/hooks";
import type { ForumReplyApi } from "@/lib/server/backend.ts";
import { timeAgoLabel } from "@/lib/date.ts";

export interface ForumReplyBoxProps {
  canModerate: boolean;
  topicId: string;
  topicTitle: string;
  initialReplies: ForumReplyApi[];
}

type ActionState = "idle" | "busy";

export default function ForumReplyBox({
  canModerate,
  topicId,
  topicTitle,
  initialReplies,
}: ForumReplyBoxProps) {
  const [replies, setReplies] = useState<ForumReplyApi[]>(initialReplies);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState<ActionState>("idle");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function send() {
    const text = body.trim();
    if (text.length < 5) {
      setError("Balasan minimal 5 karakter.");
      return;
    }
    setError(null);
    setBusy("busy");
    try {
      const res = await fetch(
        `/api/forum/topics/${encodeURIComponent(topicId)}/replies`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ body: text }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Gagal mengirim balasan.");
        return;
      }
      const created = json.data as ForumReplyApi;
      setReplies((list) => [...list, created]);
      setBody("");
      setNotice("Balasan terkirim.");
      setTimeout(() => setNotice(null), 3000);
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setBusy("idle");
    }
  }

  async function moderate(id: string, action: "hide" | "show" | "delete") {
    setError(null);
    setBusy("busy");
    try {
      const res = await fetch("/api/forum/moderate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "reply", id, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Gagal memoderasi balasan.");
        return;
      }
      if (action === "delete") {
        setReplies((list) => list.filter((entry) => entry.id !== id));
        setConfirmDelete(null);
        setNotice("Balasan dihapus.");
      } else {
        setReplies((list) =>
          list.map((entry) =>
            entry.id === id ? { ...entry, isHidden: action === "hide" } : entry
          )
        );
        setNotice(
          action === "hide"
            ? "Balasan disembunyikan dari murid."
            : "Balasan ditampilkan kembali.",
        );
      }
      setTimeout(() => setNotice(null), 3000);
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setBusy("idle");
    }
  }

  const visible = replies.filter((entry) => !entry.isHidden);

  return (
    <div>
      {visible.length === 0
        ? (
          <p class="py-8 text-center text-sm text-content-muted">
            Belum ada balasan yang tampil.
          </p>
        )
        : (
          <ul class="space-y-4">
            {visible.map((reply) => (
              <li
                key={reply.id}
                class="rounded-md border border-border bg-surface-subtle p-3"
              >
                <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <div class="flex min-w-0 flex-wrap items-center gap-2">
                    <p class="text-xs font-semibold text-content">
                      {reply.authorName}
                    </p>
                    {reply.authorRole === "guru" && (
                      <span class="inline-flex items-center rounded-full bg-role-guru/10 px-2 py-0.5 text-[10px] font-bold text-role-guru">
                        Guru
                      </span>
                    )}
                    {reply.authorRole === "admin" && (
                      <span class="inline-flex items-center rounded-full bg-role-admin/10 px-2 py-0.5 text-[10px] font-bold text-role-admin">
                        Admin
                      </span>
                    )}
                    <span class="text-xs text-content-muted">
                      {timeAgoLabel(reply.createdAt)}
                    </span>
                  </div>
                  {canModerate && (
                    <div class="flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[11px]">
                      <button
                        type="button"
                        disabled={busy === "busy"}
                        onClick={() => moderate(reply.id, "hide")}
                        class="font-semibold text-status-terlambat hover:underline disabled:opacity-50"
                      >
                        Sembunyikan
                      </button>
                      {confirmDelete === reply.id
                        ? (
                          <>
                            <button
                              type="button"
                              disabled={busy === "busy"}
                              onClick={() => moderate(reply.id, "delete")}
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
                            onClick={() => setConfirmDelete(reply.id)}
                            class="font-semibold text-status-sakit hover:underline"
                          >
                            Hapus
                          </button>
                        )}
                    </div>
                  )}
                </div>
                <p class="mt-1 text-sm leading-relaxed text-content">
                  {reply.body}
                </p>
              </li>
            ))}
          </ul>
        )}

      {canModerate && replies.some((entry) => entry.isHidden) && (
        <details class="mt-4">
          <summary class="cursor-pointer text-xs font-semibold text-status-terlambat">
            Lihat balasan tersembunyi ({replies.filter((r) => r.isHidden)
              .length})
          </summary>
          <ul class="mt-2 space-y-3">
            {replies.filter((entry) => entry.isHidden).map((reply) => (
              <li
                key={reply.id}
                class="rounded-md border border-status-terlambat/30 bg-status-terlambat/5 p-3 opacity-80"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="text-xs font-semibold text-content">
                    {reply.authorName}
                    {reply.authorRole === "guru" && " (Guru)"}
                  </p>
                  <div class="flex items-center gap-2 text-[11px]">
                    <span class="font-semibold text-status-terlambat">
                      Disembunyikan
                    </span>
                    <button
                      type="button"
                      disabled={busy === "busy"}
                      onClick={() => moderate(reply.id, "show")}
                      class="font-semibold text-primary hover:underline disabled:opacity-50"
                    >
                      Tampilkan
                    </button>
                    <button
                      type="button"
                      disabled={busy === "busy"}
                      onClick={() => moderate(reply.id, "delete")}
                      class="font-semibold text-status-sakit hover:underline disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                <p class="mt-1 text-sm leading-relaxed text-content">
                  {reply.body}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div class="mt-4 border-t border-border pt-4">
        <p class="text-xs font-medium text-content">Balas topik ini</p>
        <textarea
          rows={3}
          value={body}
          onChange={(event) => {
            setBody((event.target as HTMLTextAreaElement).value);
            setError(null);
          }}
          placeholder={`Tulis balasan untuk "${topicTitle}"…`}
          class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        {error && (
          <p role="alert" class="mt-1 text-xs text-status-sakit">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" class="mt-1 text-xs font-medium text-status-hadir">
            {notice}
          </p>
        )}
        <button
          type="button"
          onClick={send}
          disabled={busy === "busy" || !body.trim()}
          class="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {busy === "busy" ? "Mengirim…" : "Kirim Balasan"}
        </button>
      </div>
    </div>
  );
}
