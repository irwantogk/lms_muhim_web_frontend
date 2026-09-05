import { useState } from "preact/hooks";

export interface DownloadButtonProps {
  id: string;
  title: string;
}

const STORAGE_KEY = "lms_downloads";

function readStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function writeStored(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  globalThis.dispatchEvent(new CustomEvent("lms:unduhan"));
}

export default function MaterialDownload({ id, title }: DownloadButtonProps) {
  const [done, setDone] = useState(false);

  function download() {
    const stored = readStored();
    if (!stored.includes(id)) {
      writeStored([...stored, id]);
    }
    setDone(true);
    setTimeout(() => setDone(false), 2000);

    // Simulasi unduhan berkas (data tiruan)
    const content = [
      `LMS SMA Muhammadiyah Imogiri`,
      `Materi: ${title}`,
      `ID berkas: ${id}`,
      `Berkas contoh (tiruan) untuk fitur unduhan.`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${id}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      class={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
        done
          ? "bg-status-hadir/10 text-status-hadir"
          : "bg-primary text-white hover:bg-primary-hover"
      }`}
    >
      {done ? "Diunduh ✓" : "Unduh"}
    </button>
  );
}
