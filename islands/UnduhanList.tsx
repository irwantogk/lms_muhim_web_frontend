import { useEffect, useState } from "preact/hooks";

export interface UnduhanItemMeta {
  id: string;
  title: string;
  subjectName: string;
}

export interface UnduhanListProps {
  items: UnduhanItemMeta[];
}

const STORAGE_KEY = "lms_downloads";

export default function UnduhanList({ items }: UnduhanListProps) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function refresh() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown) : null;
        const list = Array.isArray(parsed)
          ? parsed.filter((v): v is string => typeof v === "string")
          : [];
        setIds(list);
        setReady(true);
      } catch {
        setReady(true);
      }
    }
    refresh();
    globalThis.addEventListener("lms:unduhan", refresh);
    return () => globalThis.removeEventListener("lms:unduhan", refresh);
  }, []);

  function remove(id: string) {
    const next = ids.filter((item) => item !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    globalThis.dispatchEvent(new CustomEvent("lms:unduhan"));
  }

  const downloaded = items.filter((item) => ids.includes(item.id));

  if (!ready) {
    return (
      <p class="py-4 text-center text-sm text-content-muted">Memuat daftar…</p>
    );
  }

  if (downloaded.length === 0) {
    return (
      <p class="py-4 text-center text-sm text-content-muted">
        Belum ada materi yang diunduh.
      </p>
    );
  }

  return (
    <ul class="divide-y divide-border">
      {downloaded.map((item) => (
        <li
          key={item.id}
          class="flex items-center justify-between gap-3 py-2.5"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-content">
              {item.title}
            </p>
            <p class="text-xs text-content-muted">{item.subjectName}</p>
          </div>
          <button
            type="button"
            onClick={() => remove(item.id)}
            class="shrink-0 rounded-md border border-border-strong bg-surface px-2.5 py-1 text-xs font-semibold text-content-muted transition-colors hover:bg-surface-muted"
          >
            Hapus dari daftar
          </button>
        </li>
      ))}
    </ul>
  );
}
